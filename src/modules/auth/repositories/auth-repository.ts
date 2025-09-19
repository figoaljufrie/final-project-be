// repositories/verification-repository.ts
import { prisma } from "../../../shared/utils/prisma";
import { $Enums, VerificationTokenType } from "../../../generated/prisma";

export class AuthRepository {
  async create(data: {
    userId: number;
    token: string;
    type: $Enums.VerificationTokenType;
    expiresAt: Date;
  }) {
    return prisma.verificationToken.create({ data });
  }

  async findValidToken(token: string, type: VerificationTokenType) {
    return prisma.verificationToken.findFirst({
      where: {
        token,
        type,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markUsed(id: number) {
    return prisma.verificationToken.update({
      where: { id },
      data: { used: true },
    });
  }
}
