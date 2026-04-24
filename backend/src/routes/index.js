import express from "express";
import authRoutes from "../modules/auth/auth.route.js";
import projectRoutes from "../modules/project/project.route.js";
import taskRoutes from "../modules/task/task.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);

export default router;
