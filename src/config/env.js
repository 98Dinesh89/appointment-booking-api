import 'dotenv/config';

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export const env = {
    port: Number(process.env.PORT) || 5000,
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
};