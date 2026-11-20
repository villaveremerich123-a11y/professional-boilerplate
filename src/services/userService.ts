
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { NotFoundError, ConflictError } from '../utils/errors';
import bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);

interface FindAllOptions {
    page: number;
    limit: number;
    sort: keyof User;
    order: 'ASC' | 'DESC';
}

export class UserService {

    // GET ALL USERS
    static async findAll(options: FindAllOptions): Promise<[User[], number]> {
        const { page, limit, sort, order } = options;
        const skip = (page - 1) * limit;

        return await userRepository.findAndCount({
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
            order: { [sort]: order },
            skip,
            take: limit,
        });
    }

    // GET USER BY ID
    static async findById(id: number): Promise<User> {
        const user = await userRepository.findOne({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        return user;
    }

    // CREATE USER
    static async create(data: {
        name: string;
        email: string;
        password: string;
        age?: number;
    }): Promise<User> {

        const existing = await userRepository.findOne({
            where: { email: data.email },
        });

        if (existing) {
            throw new ConflictError(
                'A user with this email already exists'
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = userRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            age: data.age,
        });

        await userRepository.save(user);

        return this.findById(user.id);
    }

    // UPDATE USER
    static async update(
        id: number,
        data: Partial<Pick<User, 'name' | 'email' | 'age' | 'isActive'>>
    ): Promise<User> {

        const user = await userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        if (data.email && data.email !== user.email) {
            const existing = await userRepository.findOne({
                where: { email: data.email },
            });

            if (existing) {
                throw new ConflictError(
                    'A user with this email already exists'
                );
            }
        }

        Object.assign(user, data);

        await userRepository.save(user);

        return this.findById(id);
    }

    // DELETE USER
    static async delete(id: number): Promise<void> {
        const user = await userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        await userRepository.remove(user);
    }
}
