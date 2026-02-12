import express from 'express';
import cors from 'cors';
import path from 'path';
import dishesRouter from './routes/dishes.js';
import menusRouter from './routes/menus.js';
import foodsRouter from './routes/foodsRoutes.js';
import usersRouter from './routes/users.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// ESPOSIZIONE IMMAGINI PIATTI (STATIC FILES)
app.use(
    '/food-images',
    express.static(path.join(process.cwd(), '..', 'public', 'food-images')),
);

// ROUTES API
app.use('/api/dishes', dishesRouter);
app.use('/api/menus', menusRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/users', usersRouter);

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
