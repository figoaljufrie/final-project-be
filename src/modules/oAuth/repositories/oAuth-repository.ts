import { prisma } from "../../../shared/utils/prisma";

export class OAuthRepository {
  public async findByProviderId(provider: string, providerId: string) {
    return prisma.oAuthAccount.findFirst({
      where: { provider, providerId },
      include: { user: true },
    });
  }

  public async createOAuthAccount(
    userId: number,
    provider: string,
    providerId: string,
    accessToken?: string,
    refreshToken?: string
  ) {
    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider,
        providerId,
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
      },
    });
  }
}
