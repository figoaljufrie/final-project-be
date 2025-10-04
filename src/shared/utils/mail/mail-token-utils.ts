import { randomBytes } from "crypto";
import { AuthRepository } from "../../../modules/Account/auth/repositories/auth-repository";
import { MailUtils } from "./mail-utils";

export class MailTokenService {
  private mailUtils = new MailUtils();
  private authRepository = new AuthRepository();

  // Email verification (registration or email change)
  public async sendVerification(userId: number, email: string) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1h

    await this.authRepository.create({
      userId,
      token,
      type: "email_verification",
      expiresAt,
    });

    const verifyLink = `${process.env.APP_URL}/verify-email?token=${token}`;
    await this.mailUtils.sendMail(
      email,
      "Verify your email",
      "email-verification",
      { verifyLink, email }
    );

    return token;
  }

  // Password reset (forgot password flow)
  public async sendPasswordReset(userId: number, email: string) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1h

    await this.authRepository.create({
      userId,
      token,
      type: "password_reset",
      expiresAt,
    });

    const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    await this.mailUtils.sendMail(
      email,
      "Reset your password",
      "reset-password",
      { resetLink, email }
    );

    return token;
  }
}
