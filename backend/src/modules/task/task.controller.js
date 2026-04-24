import * as taskService from "./task.service.js";

const handleError = (res, err) => {
  console.error("TASK ERROR:", err);

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
};

export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);

    return res.status(201).json({
      message: "created",
      data: task,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ message: "projectId là bắt buộc" });
    }
    const data = await taskService.getTasksByProject(projectId, req.user.id);

    return res.json({ message: "success", data });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.updateTask(taskId, req.user.id, req.body);
    return res.json({ message: "updated", data: task });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    await taskService.deleteTask(taskId, req.user.id);
    return res.json({ message: "deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Gọi hàm updateTask vì nó đã có đủ logic validate status
    const task = await taskService.updateTask(taskId, req.user.id, { status });
    return res.json({ message: "status updated", data: task });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskById(taskId, req.user.id);
    return res.json({
      message: "success",
      data: task,
    });
  } catch (err) {
    return handleError(res, err);
  }
};
