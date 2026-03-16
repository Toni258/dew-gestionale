// Runs a scheduler task under a MySQL named lock.
// This keeps cron jobs safe even if more than one backend process is running.
import { pool } from '../db/db.js';
import { logger } from '../utils/logger.js';

// Helper function used by with scheduler lock.
export async function withSchedulerLock(lockName, work) {
    const connection = await pool.getConnection();
    let lockAcquired = false;

    try {
        const [rows] = await connection.query(
            'SELECT GET_LOCK(?, 0) AS acquired',
            [lockName],
        );

        lockAcquired = Number(rows?.[0]?.acquired ?? 0) === 1;
        if (!lockAcquired) {
            return {
                skipped: true,
                reason: 'lock_not_acquired',
            };
        }

        const result = await work(connection);
        return {
            skipped: false,
            result,
        };
    } finally {
        if (lockAcquired) {
            try {
                await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
            } catch (error) {
                logger.warn('Impossibile rilasciare il lock scheduler', {
                    lockName,
                    error,
                });
            }
        }

        connection.release();
    }
}