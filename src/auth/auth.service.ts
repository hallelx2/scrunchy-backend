import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async generateNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date }> {
    const nonce = `sign-this-nonce-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store nonce in Redis would be better, but for now we'll use the message itself
    return { nonce, expiresAt };
  }

  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes(),
      );
    } catch (error) {
      return false;
    }
  }

  async verifyAndCreateUser(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<{ token: string; user: any }> {
    const isValid = await this.verifySignature(walletAddress, signature, message);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Get or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress,
          lastSeenAt: new Date(),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      walletAddress: user.walletAddress,
      userId: user.id,
    });

    return {
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: payload.walletAddress },
    });
    return user;
  }
}

