import { $Enums } from "../../../generated/prisma";

export interface UserDTO {
  name?: string | null;
  email: string;
  password?: string | null;
  role?: $Enums.UserRole;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
}