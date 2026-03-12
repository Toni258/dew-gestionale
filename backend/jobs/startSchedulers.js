import cron from 'node-cron';
import { processExpiredDishSuspensions } from './processExpiredDishSuspensions.js';

export function startSchedulers() {
    // ogni 15 minuti
    cron.schedule('*/15 * * * *', async () => {
        try {
            await processExpiredDishSuspensions();
            console.log('[cron] process_expired_dish_suspensions eseguita');
        } catch (err) {
            console.error(
                '[cron] errore process_expired_dish_suspensions:',
                err,
            );
        }
    });
}
