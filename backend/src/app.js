import routes from "./routes/index.js";
import express from "express";
import cors from "cors";

const app = express();

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// parse JSON
app.use(express.json());

// routes
app.use("/api", routes);

// health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    message: err.message || "Server error",
  });
});

export default app;
