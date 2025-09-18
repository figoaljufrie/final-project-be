import { verify, JwtPayload, sign, SignOptions } from "jsonwebtoken";
import { UserRepository } from "../../user/repository/user-repository";
import { $Enums } from "../../../generated/prisma";
import { User } from "../../../generated/prisma";
import { RegisterDTO, LoginDTO } from "../dto/auth-dto";
import bcrypt from "bcrypt";
import { ApiError } from "../../../shared/utils/api-error";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // REGISTER USER
  public async createUser(data: RegisterDTO): Promise<Omit<User, "password">> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: $Enums.UserRole["user"],
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async createTenant(data: RegisterDTO) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: $Enums.UserRole["tenant"],
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // LOGIN & JWT
  public async login(data: LoginDTO) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) throw new ApiError("User not found", 404);

    const validPassword = await bcrypt.compare(data.password, user.password!);
    if (!validPassword) throw new ApiError("Password is incorrect", 401);

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "2h";
    if (!secret) throw new ApiError("JWT Secret key not set", 401);

    const token = this.generateToken(user, secret, expiresIn);

    const { password, ...safeUser } = user;
    return { accessToken: token, user: safeUser };
  }

  private generateToken(user: any, secret: string, expiresIn: string) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const options: SignOptions = { expiresIn: expiresIn as any };
    return sign(payload, secret, options);
  }

  public async validateToken(token: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError("JWT Secret key not set", 401);

    let decoded: JwtPayload;
    try {
      decoded = verify(token, secret) as JwtPayload;
    } catch {
      throw new ApiError("Invalid or expired token.", 401);
    }

    const user = await this.userRepository.findById(decoded.id as number);
    if (!user) throw new ApiError("User not found", 404);

    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async sendVerificationEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new ApiError("User not found", 404);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError("JWT Secret key not set", 401);

    const token = sign(
      { id: user.id, email: user.email, type: "verifyEmail" },
      secret,
      { expiresIn: "15m" }
    );
    const verifyLink = `http://localhost:3000/auth/verify-email/${token}`;
    return { message: "Verification email sent", verifyLink };
  }

  public async verifyEmail(token: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError("JWT Secret key not set", 401);

    let decoded: JwtPayload;
    try {
      decoded = verify(token, secret) as JwtPayload;
    } catch {
      throw new ApiError("Invalid or expired verification link", 401);
    }

    const user = await this.userRepository.findById(decoded.id as number);
    if (!user) throw new ApiError("User not found", 404);
    if (user.isEmailVerified) throw new ApiError("Email already verified", 403);

    await this.userRepository.verifyEmail(user.id);
    return { message: "Email verified successfully" };
  }

  public async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new ApiError("Invalid email address", 400);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError("JWT Secret key not set", 401);

    const token = sign(
      {
        id: user.id,
        updatedAt: user.updatedAt.getTime(),
        type: "resetPassword",
      },
      secret,
      { expiresIn: "15m" }
    );
    const resetLink = `http://localhost:3000/auth/reset-password/${token}`;
    return { message: "Reset email sent", resetLink };
  }

  public async resetPassword(userId: number, newPassword: string) {
    if (!userId) throw new ApiError("User ID is required", 401);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.userRepository.updatePassword(
      userId,
      hashedPassword
    );
    if (!updatedUser) throw new ApiError("Failed to reset password", 400);

    return { message: "Password reset successfully", userId: updatedUser.id };
  }
}
