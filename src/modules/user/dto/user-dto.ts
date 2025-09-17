import { $Enums } from "../../../generated/prisma"

export interface UserDTO {
  name?: string,
  email?: string,
  password?: string,
  role?: $Enums.UserRole
  avatarUrl?: string;
}