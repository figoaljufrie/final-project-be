import { User } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";
import { UserDTO } from "../dto/user-dto";

export class UserRepository {
  //create logic db:
  public async create(data: UserDTO) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      },
    });

    return user;
  }

  public async getAll() {
    const user = await prisma.user.findMany();
    return user;
  }

  public async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  public async updateUser(id: number, data: UserDTO) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    return updatedUser;
  }

  public async updateAvatar(userId: number, avatarUrl: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
      },
    });
  }

  public async updatePassword(
    userId: number,
    password: string
  ): Promise<User | null> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password,
      },
    });
  }

  public async hardDeleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
