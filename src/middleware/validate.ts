import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

type ValidationSource = 'body' | 'params' | 'query';

export const validate = (
    schema: Joi.ObjectSchema,
    source: ValidationSource = 'body'
) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            const details = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type,
            }));

            const message = details.map((d) => d.message).join(', ');

            next(new ValidationError(message, details));
            return;
        }

        if (source === 'query') {
            if (req.query && typeof req.query === 'object') {
                const queryObj = req.query as Record<string, unknown>;
                for (const key of Object.keys(queryObj)) {
                    delete queryObj[key];
                }
                Object.assign(queryObj, value);
            }
        } else {
            req[source] = value;
        }

        next();
    };
};