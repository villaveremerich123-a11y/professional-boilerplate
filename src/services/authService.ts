import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { UnauthorizedError } from '../utils/errors';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

interface LoginInput {
    email: string;
    password: string;
}

export interface TokenPayload {
    userId: number;
    email: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        name: string;
    };
}

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'isActive' | 'createdAt'>;

export class AuthService {
    private static getRepo() {
        return AppDataSource.getRepository(User);
    }

    static async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;
        const userRepository = this.getRepo();

        // 1. Find user by email and explicitly include hidden password column
        const user = await userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();

        if (!user) {
            logger.warn('Login attempt with non-existent email', { email });
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if email is verified
        if (!user.isVerified) {
            logger.warn('Login attempt for unverified account', { email });
            throw new UnauthorizedError(
                'Please verify your email address before logging in. Check your inbox for the verification link.'
            );
        }

        // 2. Check if user is active
        if (!user.isActive) {
            logger.warn('Login attempt for inactive account', { email });
            throw new UnauthorizedError('Account is deactivated');
        }

        // 3. Compare plain password with stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn('Login attempt with wrong password', { email });
            throw new UnauthorizedError('Invalid email or password');
        }

        // 4. Sign JWT token
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
        };

        const token = jwt.sign(tokenPayload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
        });

        logger.info('User logged in successfully', { userId: user.id, email });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }

    static async verifyToken(token: string): Promise<TokenPayload> {
        try {
            return jwt.verify(token, config.jwt.secret) as unknown as TokenPayload;
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.name === 'TokenExpiredError') {
                    throw new UnauthorizedError('Token has expired');
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new UnauthorizedError('Invalid token');
                }
            }
            throw new UnauthorizedError('Authentication failed');
        }
    }

    static async getUserFromToken(token: string): Promise<SafeUser> {
        const decoded = await this.verifyToken(token);

        const user = await this.getRepo().findOne({
            where: { id: decoded.userId },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            isActive: user.isActive,
            createdAt: user.createdAt,
        };
    }
}