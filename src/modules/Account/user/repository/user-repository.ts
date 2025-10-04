import { Prisma, User } from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
import { prisma } from "../../../../shared/utils/prisma";
import { UserDTO } from "../dto/user-dto";

export class UserRepository {
  public async create(data: UserDTO) {
    const user = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email: data.email!,
        password: data.password ?? null,
        role: data.role ?? "user",
        avatarUrl: data.avatarUrl ?? null,
        isEmailVerified: data.isEmailVerified ?? false,
      },
    });
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async verifyEmail(userId: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async verifyEmailAndSetPassword(
    userId: number,
    hashedPassword: string
  ) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isEmailVerified: true,
      },
    });

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async findByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async findByEmailWithPassword(email: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) return null;
    return user;
  }

  public async findByEmailWithOAuth(email: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { oauthAccounts: true },
    });
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async getAll() {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
    });
    return users.map(({ password, ...safeUser }) => safeUser);
  }

  public async getMe(id: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new ApiError("User not found", 404);
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async findById(id: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async findByIdWithPassword(id: number): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async updateEmail(userId: number, email: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email, isEmailVerified: false },
    });
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async updateUser(id: number, data: Partial<UserDTO>) {
    // strip password & email if provided
    const { email: __, ...safeData } = data;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: safeData as Prisma.UserUpdateInput,
    });

    // strip password before returning
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async updateAvatar(id: number, avatarUrl: string) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async updatePassword(id: number, password: string) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password },
    });
    const { password: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async softDeleteUser(id: number) {
    const deletedUser = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    const { password, ...safeUser } = deletedUser;
    return safeUser;
  }

  public async hardDeleteUser(id: number) {
    const deletedUser = await prisma.user.delete({
      where: { id },
    });
    const { password, ...safeUser } = deletedUser;
    return safeUser;
  }
}
