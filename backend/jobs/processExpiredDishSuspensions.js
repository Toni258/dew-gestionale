import { pool } from '../db/db.js';

export async function processExpiredDishSuspensions() {
    await pool.query(`CALL process_expired_dish_suspensions()`);
}
