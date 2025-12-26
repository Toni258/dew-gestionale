import express from 'express';
import cors from 'cors';
import path from 'path';
import dishesRouter from './routes/dishes.js';
import menusRouter from './routes/menus.js';

const app = express();

app.use(cors());
app.use(express.json());

// ESPOSIZIONE IMMAGINI PIATTI (STATIC FILES)
app.use(
    '/food-images',
    express.static(path.join(process.cwd(), '..', 'public', 'food-images'))
);

// ROUTES API
app.use('/api/dishes', dishesRouter);
app.use('/api/menus', menusRouter);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
