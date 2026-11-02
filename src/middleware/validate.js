import { AppError } from '../utils/AppError.js';

export function validate(schemas) {
    return (req, res, next) => {
        const validated = {};
        const errors = [];

        for (const source of ['body', 'query', 'params']) {
            if (!schemas[source]) continue;

            const result = schemas[source].safeParse(req[source] ?? {});
            if (result.success) {
                validated[source] = result.data;
            } else {
                for (const issue of result.error.issues) {
                    errors.push({
                        field: issue.path.join('.') || source,
                        message: issue.message,
                    });
                }
            }
        }

        if (errors.length > 0) {
            return next(new AppError(400, 'Validation failed', errors));
        }

        req.validated = validated;
        return next();
    };
}