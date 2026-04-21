import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
  ensureProjectMember,
  canAssignTask,
  canUpdateTask,
  canDeleteTask,
} from "./task.permission.js";

// CONSTANTS
const VALID_PRIORITY = ["LOW", "MEDIUM", "HIGH"];
const VALID_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const STATUS_TRANSITIONS = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE"],
  DONE: [],
};
const canTransition = (currentStatus, nextStatus) => {
  return STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus);
};

// CREATE TASK
export const createTask = async (userId, payload) => {
  const {
    title = "",
    description,
    projectId,
    assigneeId,
    priority,
    deadline,
  } = payload;

  if (!title.trim()) {
    throw new AppError("title is required", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // check member + get role
  const member = await ensureProjectMember(projectId, userId);

  // OPTIONAL RULE (safe default)
  // MEMBER vẫn được tạo task nhưng không được assign người khác nếu muốn siết sau
  if (assigneeId) {
    canAssignTask(member.role);

    const assignee = await prisma.projectMember.findFirst({
      where: {
        projectId,
        accountId: assigneeId,
      },
    });

    if (!assignee) {
      throw new AppError("Assignee must be in project", 400);
    }
  }

  if (priority && !VALID_PRIORITY.includes(priority)) {
    throw new AppError("Invalid priority", 400);
  }

  return prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      projectId,
      assigneeId: assigneeId ?? null,
      priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null,
      createdById: userId,
    },
  });
};

// GET TASKS BY PROJECT
export const getTasksByProject = async (query, userId) => {
  const { projectId, status, search, page = 1, limit = 10 } = query;

  if (!projectId?.trim()) {
    throw new AppError("projectId is required", 400);
  }

  // Check access
  await ensureProjectMember(projectId, userId);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Number(limit) || 10, 50);

  if (status && !VALID_STATUS.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const where = {
    projectId: projectId.trim(),
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      title: { contains: search.trim(), mode: "insensitive" },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

// UPDATE TASK
export const updateTask = async (taskId, userId, payload) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.deletedAt) {
    throw new AppError("Task already deleted", 400);
  }

  // get member + role
  const member = await ensureProjectMember(task.projectId, userId);

  // permission check
  canUpdateTask(member.role, task, userId);

  // ===== VALIDATION =====

  // Status
  if (payload.status !== undefined) {
    if (!VALID_STATUS.includes(payload.status)) {
      throw new AppError("Invalid status", 400);
    }

    if (payload.status !== task.status) {
      // DONE lock
      if (task.status === "DONE") {
        throw new AppError("Task already completed", 400);
      }

      // transition rule
      if (!canTransition(task.status, payload.status)) {
        throw new AppError("Invalid status transition", 400);
      }

      // permission
      if (member.role === "MEMBER") {
        if (task.assigneeId !== userId) {
          throw new AppError("Permission denied", 403);
        }
      }
    }
  }

  // priority
  if (
    payload.priority !== undefined &&
    !VALID_PRIORITY.includes(payload.priority)
  ) {
    throw new AppError("Invalid priority", 400);
  }

  // assignee
  if (payload.assigneeId !== undefined) {
    canAssignTask(member.role);

    if (payload.assigneeId) {
      const assignee = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          accountId: payload.assigneeId,
        },
      });

      if (!assignee) {
        throw new AppError("Assignee must be in project", 400);
      }
    }
  }

  // ===== BUILD DATA (sau khi validate xong) =====
  // const data = {
  //   title: payload.title?.trim(),
  //   description: payload.description?.trim() || null,
  //   priority: payload.priority,
  //   status: payload.status,
  //   assigneeId:
  //     payload.assigneeId !== undefined ? payload.assigneeId : undefined,
  // };
  // if (payload.deadline !== undefined) {
  //   data.deadline = payload.deadline ? new Date(payload.deadline) : null;
  // }

  const data = {};

  if (payload.title !== undefined) {
    data.title = payload.title.trim();
  }

  if (payload.description !== undefined) {
    data.description = payload.description?.trim() || null;
  }

  if (payload.priority !== undefined) {
    data.priority = payload.priority;
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (payload.assigneeId !== undefined) {
    data.assigneeId = payload.assigneeId;
  }

  if (payload.deadline !== undefined) {
    data.deadline = payload.deadline ? new Date(payload.deadline) : null;
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
  });
};

// DELETE TASK (SOFT DELETE)
export const deleteTask = async (taskId, userId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.deletedAt) {
    return task; // idempotent
  }

  const member = await ensureProjectMember(task.projectId, userId);

  // permission check
  canDeleteTask(member.role);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      deletedAt: new Date(),
    },
  });
};

// UPDATE TASK STATUS
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const result = await updateTask(taskId, userId, { status });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
