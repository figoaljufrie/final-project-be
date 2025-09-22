import { UserRepository } from "../../user/repository/user-repository";
import { OAuthRepository } from "../repositories/oAuth-repository";
import admin from "../../firebase/config/firebase-config";
import { ApiError } from "../../../shared/utils/api-error";

export class OAuthService {
  private userRepository = new UserRepository();
  private oauthRepository = new OAuthRepository();

  public async socialLogin(idToken: string, provider: string) {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    //cek oAuth-account ada atau ngga, kl ada, generate token:
    let oauthAccount = await this.oauthRepository.findByProviderId(
      provider,
      uid
    );
    if (oauthAccount) {
      const token = this.generateToken(oauthAccount.user);
      return { user: oauthAccount.user, accessToken: token };
    }

    //Cek user via emiail, klo gak ada, creaet user:
    let user = await this.userRepository.findByEmail(email!);

    if (!user) {
      const createdUser = await this.userRepository.create({
        email: email!,
        name,
        role: "user",
        isEmailVerified: true,
      });
      user = createdUser;
    }

    // Bikin OAuth-Account:
    await this.oauthRepository.createOAuthAccount(user.id, provider, uid);

    // generateToken;
    const token = this.generateToken(user);

    return { user, accessToken: token };
  }

  private generateToken(user: any) {
    if (!process.env.JWT_SECRET) throw new ApiError("JWT_SECRET not set", 403);
    return require("jsonwebtoken").sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
  }
}
