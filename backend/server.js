import express from 'express';
import cors from 'cors';
import path from 'path';
import dishesRouter from './routes/dishes.js';
import menusRouter from './routes/menus.js';
import foodsRouter from './routes/foodsRoutes.js';
import usersRouter from './routes/users.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';

import { requireAuth, requireRole } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// IMPORTANTISSIMO: se frontend e backend sono su domini/porte diverse (5173 e 3001)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
    cors({
        origin: corsOrigin, // metti la origin del frontend
        credentials: true,
    }),
);

// ESPOSIZIONE IMMAGINI PIATTI (STATIC FILES)
app.use(
    '/food-images',
    express.static(path.join(process.cwd(), '..', 'public', 'food-images')),
);

// ROUTES API
app.use('/api/dishes', requireAuth, dishesRouter);
app.use('/api/menus', requireAuth, menusRouter);
app.use('/api/foods', requireAuth, foodsRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/auth', authRouter);

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
