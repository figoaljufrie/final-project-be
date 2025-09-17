import { UserRepository } from "../repository/user-repository";
import { UserDTO } from "../dto/user-dto";
import bcrypt from "bcrypt";
import { ApiError } from "../../../shared/utils/api-error";

export class UserService {
  userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  //TODO: Move this to auth.service
  // public async createUser(data: UserDTO) {
  //   const hashedPassword = await bcrypt.hash(data.password, 10);
  //   return await this.userRepository.create({
  //     ...data,
  //     password: hashedPassword,
  //     role: "user",
  //   });
  // }
  //TODO: Move this to auth.service
  // public async createTenant(data: UserDTO) {
  //   const hashedPassword = await bcrypt.hash(data.password, 10);
  //   return await this.userRepository.create({
  //     ...data,
  //     password: hashedPassword,
  //     role: "tenant",
  //   });
  // }

  public async getAll() {
    return await this.userRepository.getAll();
  }

  public async getMe(id: number) {
    return await this.userRepository.getMe(id);
  }

  public async findById(id: number) {
    return await this.userRepository.findById(id);
  }

  public async updateEmail(id: number, email: string) {
    return await this.userRepository.updateEmail(id, email);
  }

  public async updateUser(id: number, data: UserDTO) {
    return await this.userRepository.updateUser(id, data);
  }

  public async updateAvatar(id: number, avatarUrl: string) {
    return await this.userRepository.updateAvatar(id, avatarUrl);
  }

  public async updatePassword(id: number, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userRepository.updatePassword(id, hashedPassword);
  }

  public async softDeleteUser(id: number) {
    return await this.userRepository.softDeleteUser(id);
  }

  public async hardDeleteUser(id: number) {
    return await this.userRepository.hardDeleteUser(id);
  }
}
