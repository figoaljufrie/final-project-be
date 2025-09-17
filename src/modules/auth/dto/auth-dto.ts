import { $Enums } from "../../../generated/prisma";

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: $Enums.UserRole
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenDTO {
  userId: number;
  token: string;
  type: $Enums.VerificationTokenType;
  expiresAt: Date;
  used?: boolean;
}