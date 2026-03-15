import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import dishesRouter from './routes/dishes.js';
import menusRouter from './routes/menus.js';
import archivedMenusRouter from './routes/archivedMenus.js';
import foodsRouter from './routes/foodsRoutes.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import reportsRouter from './routes/reports.js';
import dashboardRouter from './routes/dashboard.js';

import { appConfig } from './config/appConfig.js';
import { storageConfig } from './config/storageConfig.js';
import { startSchedulers } from './jobs/startSchedulers.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ensureRuntimeDirectoriesSync, logger } from './utils/logger.js';

ensureRuntimeDirectoriesSync();

const app = express();

app.disable('x-powered-by');

if (appConfig.app.trustProxy) {
    app.set('trust proxy', 1);
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) {
                callback(null, true);
                return;
            }

            if (appConfig.app.corsOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Origin non consentita dal CORS'));
        },
        credentials: true,
    }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ESPOSIZIONE IMMAGINI PIATTI (STATIC FILES)
app.use(
    storageConfig.foodImagesPublicPath,
    express.static(storageConfig.foodImagesDir),
);


// HEALTHCHECK TECNICO
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        status: 'up',
        env: appConfig.app.nodeEnv,
        time: new Date().toISOString(),
    });
});

// ROUTES API
app.use('/api/auth', authRouter);
app.use('/api/dishes', requireAuth, dishesRouter);
app.use('/api/menus', requireAuth, menusRouter);
app.use('/api/archived-menus', requireAuth, archivedMenusRouter);
app.use('/api/foods', requireAuth, foodsRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

// AVVIO SCHEDULER PER CONTROLLO SOSPENSIONI SCADUTE
startSchedulers();

app.listen(appConfig.app.port, () => {
    logger.info(`Backend running on http://localhost:${appConfig.app.port}`, {
        foodImagesDir: storageConfig.foodImagesDir,
        foodImagesPublicPath: storageConfig.foodImagesPublicPath,
        schedulersEnabled: appConfig.schedulers.enableSchedulers,
    });
});
