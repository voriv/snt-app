import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
}

export class AuthMiddleware {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.secret, { expiresIn: '24h' });
  }
}

export const authMiddleware = new AuthMiddleware(
  process.env.WS_INTERNAL_SECRET || 'default-secret-change-in-production',
);
