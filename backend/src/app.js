import express from "express";
import authRoutes from "./modules/auth/auth.route.js";
import projectRoutes from "./modules/project/project.route.js";
import taskRoutes from "./modules/task/task.route.js";
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

// health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server running",
  });
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

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
