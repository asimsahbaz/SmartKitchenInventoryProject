import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client';
import { BusinessError, UnauthorizedError } from '../../shared/errors/AppError';

export class AuthService {
  async register(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BusinessError('An account with this email already exists.', 'DUPLICATE_EMAIL');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    const tokens = this.signTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.', 'TOKEN_INVALID');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password.', 'TOKEN_INVALID');
    }
    const { passwordHash: _, ...safeUser } = user;
    const tokens = this.signTokens(user.id, user.role);
    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, createdAt: true },
      });
      if (!user) throw new UnauthorizedError();
      const { accessToken } = this.signTokens(user.id, user.role);
      return { accessToken, user };
    } catch {
      throw new UnauthorizedError('Invalid refresh token.', 'TOKEN_INVALID');
    }
  }

  private signTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m' }
    );
    const refreshToken = jwt.sign(
      { userId, role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' }
    );
    return { accessToken, refreshToken };
  }
}
