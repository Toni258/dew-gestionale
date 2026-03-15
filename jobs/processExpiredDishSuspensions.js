import { appConfig } from '../config/appConfig.js';
import { pool } from '../db/db.js';
import { logger } from '../utils/logger.js';

export async function processExpiredDishSuspensions() {
    const connection = await pool.getConnection();

    try {
        const [lockRows] = await connection.query(
            `SELECT GET_LOCK(?, 0) AS acquired`,
            [appConfig.schedulers.lockName],
        );
        const acquired = Number(lockRows?.[0]?.acquired ?? 0) === 1;

        if (!acquired) {
            logger.info('Scheduler skipped: lock già occupato');
            return { ok: true, executed: false, reason: 'lock-busy' };
        }

        try {
            await connection.query(`CALL process_expired_dish_suspensions()`);
            return { ok: true, executed: true };
        } finally {
            try {
                await connection.query(`SELECT RELEASE_LOCK(?)`, [
                    appConfig.schedulers.lockName,
                ]);
            } catch (error) {
                logger.warn('Impossibile rilasciare il lock scheduler', error);
            }
        }
    } finally {
        connection.release();
    }
}
