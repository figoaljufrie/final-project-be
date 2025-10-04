import { $Enums } from "../../../../generated/prisma";

export interface UserDTO {
  id?: number;
  name?: string | null;
  email?: string | null; 
  password?: string | null;
  role?: $Enums.UserRole;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  dateOfBirth?: Date | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}
