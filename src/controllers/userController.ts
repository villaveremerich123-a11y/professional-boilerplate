
import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import {
    sendSuccess,
    sendCreated,
    sendNoContent,
    sendPaginated,
    createPaginationMeta
} from '../utils/response';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserController');

export class UserController {

    // GET ALL USERS
    static async getAll(req: Request, res: Response) {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const allowedSort = [
            'id',
            'name',
            'email',
            'age',
            'createdAt',
            'updatedAt'
        ] as const;

        const requestedSort = String(req.query.sort || 'createdAt');

        const sort = allowedSort.includes(
            requestedSort as typeof allowedSort[number]
        ) ? requestedSort as typeof allowedSort[number] : 'createdAt';

        const requestedOrder = String(req.query.order || 'DESC').toUpperCase();

        const order: 'ASC' | 'DESC' =
            requestedOrder === 'ASC' ? 'ASC' : 'DESC';

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }

        const [users, total] = await UserService.findAll({
            page,
            limit,
            sort,
            order
        });

        const meta = createPaginationMeta(total, page, limit);

        logger.info('Users retrieved', { count: total, page, limit });

        return sendPaginated(res, users, meta);
    }

    // GET USER BY ID
    static async getById(req: Request, res: Response) {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await UserService.findById(id);

        logger.info('User retrieved', { userId: id });

        return sendSuccess(res, user);
    }

    // CREATE USER
    static async create(req: Request, res: Response) {
        const user = await UserService.create(req.body);

        logger.info('User created', {
            userId: user.id,
            email: user.email
        });

        return sendCreated(res, user, 'User created successfully');
    }

    // UPDATE USER
    static async update(req: Request, res: Response) {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await UserService.update(id, req.body);

        logger.info('User updated', { userId: id });

        return sendSuccess(res, user, 'User updated successfully');
    }

    // DELETE USER
    static async delete(req: Request, res: Response) {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        await UserService.delete(id);

        logger.info('User deleted', { userId: id });

        return sendNoContent(res);
    }
}
