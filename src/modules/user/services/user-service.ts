// modules/user/services/user-service.ts
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { ApiError } from "../../../shared/utils/api-error";
import { MailUtils } from "../../../shared/utils/mail/mail";
import { AuthRepository } from "../../auth/repositories/auth-repository";
import { UserDTO } from "../dto/user-dto";
import { UserRepository } from "../repository/user-repository";

export class UserService {
  private userRepository: UserRepository;
  private mailUtils: MailUtils;
  private authRepository: AuthRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.mailUtils = new MailUtils();
    this.authRepository = new AuthRepository();
  }

  public async getAll() {
    const users = await this.userRepository.getAll();
    if (!users || users.length === 0) {
      throw new ApiError("No users found", 404);
    }
    return users;
  }

  public async getMe(id: number) {
    const user = await this.userRepository.getMe(id);
    if (!user) throw new ApiError("User not found", 404);
    return user;
  }

  public async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);
    return user;
  }

  public async updateEmail(userId: number, email: string) {
    const updatedUser = await this.userRepository.updateEmail(userId, email);

    // auto-send verification email
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepository.create({
      userId: updatedUser.id,
      token,
      type: "email_verification",
      expiresAt,
    });

    const verifyLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
    await this.mailUtils.sendMail(
      email,
      "Verify your updated email",
      "email-verification",
      { verifyLink, token }
    );

    return updatedUser;
  }

  public async updateUser(id: number, data: UserDTO) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);
    return await this.userRepository.updateUser(id, data);
  }

  public async updateAvatar(id: number, avatarUrl: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);
    return await this.userRepository.updateAvatar(id, avatarUrl);
  }

  public async updatePasswordWithCurrent(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    if (!currentPassword || !newPassword) {
      throw new ApiError("Both current and new passwords are required", 400);
    }

    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError("User not found", 404);

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.password!
    );
    if (!isCurrentValid)
      throw new ApiError("Current password is incorrect", 401);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);

    return { message: "Password updated successfully" };
  }

  public async softDeleteUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);

    return await this.userRepository.softDeleteUser(id);
  }

  public async hardDeleteUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);

    return await this.userRepository.hardDeleteUser(id);
  }
}
