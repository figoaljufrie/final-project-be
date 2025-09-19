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
        name: data.name ?? null, 
        email: data.email,
        password: data.password ?? null, 
        role: data.role ?? "user",
        avatarUrl: data.avatarUrl ?? null, 
        isEmailVerified: data.isEmailVerified ?? false,
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
    return user.map(({ password, ...safeUser }) => safeUser);
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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // Returns the full user object including password
  public async findByIdWithPassword(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
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

  public async updateUser(id: number, data: UserDTO) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
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
