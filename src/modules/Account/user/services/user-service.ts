// modules/user/services/user-service.ts
import bcrypt from "bcrypt";
import { ApiError } from "../../../../shared/utils/api-error";
import { MailTokenService } from "../../../../shared/utils/mail/mail-token-service";
import { UserDTO } from "../dto/user-dto";
import { UserRepository } from "../repository/user-repository";

export class UserService {
  private userRepository = new UserRepository();
  private mailTokenService = new MailTokenService();

  public async getAll() {
    const users = await this.userRepository.getAll();
    if (!users.length) throw new ApiError("No users found", 404);
    return users;
  }

  public async getMe(id: number) {
    return this.userRepository.getMe(id);
  }

  public async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ApiError("User not found", 404);
    return user;
  }

  public async updateEmail(userId: number, email: string) {
    const updatedUser = await this.userRepository.updateEmail(userId, email);
    await this.mailTokenService.sendVerification(updatedUser.id, email);
    return updatedUser;
  }

  public async updateUser(id: number, data: Partial<UserDTO>) {
    if (data.password) {
      throw new ApiError(
        "Password update not allowed here. Use updatePassword.",
        400
      );
    }
    return this.userRepository.updateUser(id, data);
  }

  public async updateAvatar(id: number, avatarUrl: string) {
    return this.userRepository.updateAvatar(id, avatarUrl);
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
    return this.userRepository.updatePassword(userId, hashedPassword);
  }

  public async softDeleteUser(id: number) {
    return this.userRepository.softDeleteUser(id);
  }

  public async hardDeleteUser(id: number) {
    return this.userRepository.hardDeleteUser(id);
  }
}
