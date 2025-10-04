import { $Enums } from "../../../../generated/prisma";

export interface RegisterDTO {
  email: string;
  role?: $Enums.UserRole;
}

export interface SetPasswordDTO {
  password: string;
}

// Step 4: Login
export interface LoginDTO {
  email: string;
  password: string;
}

// Token handling (internal)
export interface TokenDTO {
  userId: number;
  token: string;
  type: $Enums.VerificationTokenType;
  expiresAt: Date;
  used?: boolean;
}
