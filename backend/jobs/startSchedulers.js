// Registers backend cron jobs.
// Jobs are guarded by a named MySQL lock so they do not overlap across processes.
import cron from 'node-cron';
import { appConfig } from '../config/appConfig.js';
import { processExpiredDishSuspensions } from './processExpiredDishSuspensions.js';
import { withSchedulerLock } from './withSchedulerLock.js';
import { logger } from '../utils/logger.js';

async function runExpiredSuspensionsJob() {
    return withSchedulerLock(appConfig.schedulers.lockName, async (conn) => {
        return processExpiredDishSuspensions(conn);
    });
}

export function startSchedulers() {
    if (!appConfig.schedulers.enableSchedulers) {
        logger.info('Scheduler sospensioni disabilitato via configurazione');
        return;
    }

    cron.schedule('*/15 * * * *', async () => {
        try {
            const result = await runExpiredSuspensionsJob();

            if (result?.skipped) {
                logger.info(
                    'Scheduler sospensioni saltato: lock già in uso da un altro processo',
                );
                return;
            }

            logger.info('Scheduler process_expired_dish_suspensions eseguito');
        } catch (error) {
            logger.error(
                'Errore scheduler process_expired_dish_suspensions',
                error,
            );
        }
    });

    logger.info('Scheduler sospensioni avviato (ogni 15 minuti)');
}
