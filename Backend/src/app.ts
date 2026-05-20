import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorMiddleware, requestLogger } from "./core/middleware/index.js";

const app = express();
app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;
