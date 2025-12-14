import express from "express";
import cors from "cors";
import dishesRouter from "./routes/dishes.js";

const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/dishes", dishesRouter);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
