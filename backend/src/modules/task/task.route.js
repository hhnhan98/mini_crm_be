import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  updateStatus,
} from "./task.controller.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createTask);
router.get("/", getTasksByProject); // GET /tasks?projectId=abc&status=TODO&search=bug&page=2
router.get("/:taskId", getTaskById); // GET /api/tasks/:taskId
router.put("/:taskId", updateTask);
router.patch("/:taskId/status", updateStatus); // dùng patch thay vì put vì chỉ update 1 field (status)
router.delete("/:taskId", deleteTask);

export default router;
