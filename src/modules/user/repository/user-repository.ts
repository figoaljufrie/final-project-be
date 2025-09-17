import { User } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";
import { UserDTO } from "../dto/user-dto";

export class UserRepository {
  //create logic db:
  public async create(data: UserDTO) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email! },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const user = await prisma.user.create({
      data: {
        name: data.name!,
        email: data.email!,
        password: data.password!,
        role: data.role!,
      },
    });

    return user;
  }

  public async verifyEmail(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  public async getAll() {
    const user = await prisma.user.findMany();
    return user;
  }

  public async getMe(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new Error("User not found");
    const { password, ...safeUser } = user;
    return safeUser;
  }

  public async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public async updateEmail(
    userId: number,
    email: string
  ): Promise<User | null> {
    const updateEmail = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        isEmailVerified: false,
      },
    });
    return updateEmail;
  }

  public async updateUser(id: number, data: UserDTO) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    return updatedUser;
  }

  public async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        avatarUrl,
      },
    });
  }

  public async updatePassword(
    id: number,
    password: string
  ): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: {
        password,
      },
    });
  }

  public async softDeleteUser(id: number) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async hardDeleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
