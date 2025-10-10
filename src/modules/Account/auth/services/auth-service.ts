import bcrypt from "bcrypt";
import { JwtPayload, sign, SignOptions, verify } from "jsonwebtoken";
import { $Enums } from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
import { MailTokenService } from "../../../../shared/utils/mail/mail-token-service";
import { UserRepository } from "../../user/repository/user-repository";
import { LoginDTO, RegisterDTO } from "../dto/auth-dto";
import { AuthRepository } from "../repositories/auth-repository";

export class AuthService {
  private userRepository = new UserRepository();
  private authRepository = new AuthRepository();
  private mailTokenService = new MailTokenService();

  // ---------- Account Creation ----------
  private async createAccount(data: RegisterDTO, role: $Enums.UserRole) {
    const existing = await this.userRepository.findByEmail(data.email);

    if (existing) {
      if (existing.isEmailVerified) {
        throw new ApiError(`${role} with this email already exists`, 400);
      } else {
        // Resend verification if already registered but not verified
        await this.issueVerificationToken(existing.id, existing.email);
        return {
          message:
            "Email already registered but not verified. Verification email resent.",
          user: existing,
        };
      }
    }

    const user = await this.userRepository.create({
      email: data.email,
      role,
      isEmailVerified: false,
    });

    await this.issueVerificationToken(user.id, user.email);

    return { message: "Verification email sent", user };
  }

  public createUser(data: RegisterDTO) {
    return this.createAccount(data, $Enums.UserRole.user);
  }

  public createTenant(data: RegisterDTO) {
    return this.createAccount(data, $Enums.UserRole.tenant);
  }

  // ---------- Login ----------
  public async login(data: LoginDTO) {
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) throw new ApiError("User not found", 404);

    const validPassword = await bcrypt.compare(data.password, user.password!);
    if (!validPassword) throw new ApiError("Password is incorrect", 401);

    if (!process.env.JWT_SECRET)
      throw new ApiError("JWT Secret key not set", 500);

    const token = this.generateToken(
      user,
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN || "2h"
    );

    const { password, ...safeUser } = user;
    return { accessToken: token, user: safeUser };
  }

  private generateToken(user: any, secret: string, expiresIn: string) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const options: SignOptions = { expiresIn: expiresIn as any };
    return sign(payload, secret, options);
  }

  // ---------- Email Verification ----------
  private async issueVerificationToken(userId: number, email: string) {
    await this.mailTokenService.sendVerification(userId, email);
  }

  public async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new ApiError("User not found", 404);
    if (user.isEmailVerified) throw new ApiError("Email already verified", 400);

    await this.issueVerificationToken(user.id, user.email);
    return { message: "Verification email resent" };
  }

  // Unified verification handler
  public async verifyTokenAndUpdate(
    token: string,
    type: $Enums.VerificationTokenType,
    updateData: Partial<{ password: string; isEmailVerified: boolean }>
  ) {
    const record = await this.authRepository.findValidToken(token, type);
    if (!record) throw new ApiError("Invalid or expired token", 401);

    let updatedUser;

    if (updateData.password) {
      updatedUser = await this.userRepository.verifyEmailAndSetPassword(
        record.userId,
        updateData.password
      );
    } else {
      updatedUser = await this.userRepository.updateUser(
        record.userId,
        updateData
      );
    }

    await this.authRepository.markUsed(record.id);

    return { user: updatedUser };
  }

  // ---------- Password Reset ----------
  public async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmailWithOAuth(email);
    if (!user) throw new ApiError("User not found", 404);

    if (user.oauthAccounts && user.oauthAccounts.length > 0) {
      const providers = user.oauthAccounts
        .map((acc) => acc.provider)
        .join(", ");
      throw new ApiError(
        `Password reset not available for social login accounts (${providers})`,
        400
      );
    }

    await this.mailTokenService.sendPasswordReset(user.id, user.email);
    return { message: "Password reset link sent" };
  }

  // ---------- JWT Validation (for session) ----------
  public async validateToken(token: string) {
    if (!process.env.JWT_SECRET)
      throw new ApiError("JWT Secret key not set", 500);

    let decoded: JwtPayload;
    try {
      decoded = verify(token, process.env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new ApiError("Invalid or expired token.", 401);
    }

    const user = await this.userRepository.findByIdWithPassword(
      decoded.id as number
    );
    if (!user) throw new ApiError("User not found", 404);

    const { password, ...safeUser } = user;
    return safeUser;
  }
}
