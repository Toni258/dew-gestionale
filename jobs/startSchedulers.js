import cron from 'node-cron';
import { appConfig } from '../config/appConfig.js';
import { processExpiredDishSuspensions } from './processExpiredDishSuspensions.js';
import { logger } from '../utils/logger.js';

export function startSchedulers() {
    if (!appConfig.schedulers.enableSchedulers) {
        logger.info('Scheduler sospensioni disabilitato via configurazione');
        return;
    }

    cron.schedule('*/15 * * * *', async () => {
        try {
            const result = await processExpiredDishSuspensions();
            logger.info('Scheduler process_expired_dish_suspensions eseguito', result);
        } catch (error) {
            logger.error('Errore scheduler process_expired_dish_suspensions', error);
        }
    });

    logger.info('Scheduler sospensioni avviato (ogni 15 minuti)');
}
