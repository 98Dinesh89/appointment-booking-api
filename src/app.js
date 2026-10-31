import express from 'express';
import pool from './config/db.js';

const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'unreachable' });
    }
});

export default app;