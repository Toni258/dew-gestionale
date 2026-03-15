/**
 * Executes the stored procedure that closes expired dish suspensions.
 * The optional connection argument is useful when the job runs under a named lock.
 */
import { pool } from '../db/db.js';

export async function processExpiredDishSuspensions(poolOrConn = pool) {
    await poolOrConn.query('CALL process_expired_dish_suspensions()');

    return {
        ok: true,
    };
}
