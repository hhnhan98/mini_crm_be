import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
  getProjectMember,
  canUpdateTask,
  canDeleteTask,
  canAssignTask,
} from "./task.permission.js";

// Constants
const VALID_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

// Validate Status Transition
const validateStatusTransition = (current, next) => {
  const rules = {
    TODO: ["IN_PROGRESS"],
    IN_PROGRESS: ["IN_REVIEW"],
    IN_REVIEW: ["DONE"],
    DONE: [],
  };

  if (!rules[current]?.includes(next)) {
    throw new AppError(
      `Không thể chuyển trạng thái từ ${current} → ${next}`,
      400
    );
  }
};

// ✅ createTask — chỉ OWNER/MANAGER mới tạo được
export const createTask = async (userId, payload) => {
  const { title, description, priority, assigneeId, projectId } = payload;

  if (!projectId) throw new AppError("projectId là bắt buộc", 400);

  const member = await getProjectMember(projectId, userId); // ✅ dùng permission layer
  console.log("GET TASKS - member found:", member);

  if (member.role === "MEMBER") {
    throw new AppError("MEMBER không có quyền tạo task", 403);
  }

  if (assigneeId) {
    const assignee = await prisma.projectMember.findFirst({
      where: { projectId, accountId: assigneeId },
    });
    if (!assignee) throw new AppError("Assignee không thuộc project", 400);
  }

  return prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      status: "TODO",
      projectId,
      assigneeId: assigneeId || null,
      createdById: userId,
    },
  });
};

// Get Task By Id
export const getTaskById = async (taskId, userId) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!task) throw new AppError("Task không tồn tại", 404);

  await getProjectMember(task.projectId, userId); // ✅ dùng permission layer
  return task;
};

// Get Tasks By Project
export const getTasksByProject = async (projectId, userId) => {
  console.log("GET TASKS - projectId:", projectId);
  console.log("GET TASKS - userId:", userId);
  await getProjectMember(projectId, userId); // ✅ thay toàn bộ đoạn findFirst cũ

  return prisma.task.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { id: true, name: true } },
    },
  });
};

// ✅ updateTask — OWNER/MANAGER/assignee mới update được
export const updateTask = async (taskId, userId, payload) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new AppError("Task không tồn tại", 404);

  const member = await getProjectMember(task.projectId, userId); // ✅
  canUpdateTask(member.role, task, userId); // ✅ throw nếu không có quyền

  // ✅ Whitelist fields — không cho inject projectId, createdById, deletedAt
  const allowedFields = {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && {
      description: payload.description,
    }),
    ...(payload.priority !== undefined && { priority: payload.priority }),
    ...(payload.status !== undefined && { status: payload.status }),
    ...(payload.assigneeId !== undefined && { assigneeId: payload.assigneeId }),
    ...(payload.deadline !== undefined && { deadline: payload.deadline }),
  };

  // ✅ Chỉ OWNER/MANAGER mới assign
  if ("assigneeId" in payload) {
    canAssignTask(member.role);

    if (payload.assigneeId) {
      const assignee = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, accountId: payload.assigneeId },
      });
      if (!assignee) throw new AppError("Assignee không thuộc project", 400);
    }
  }

  if ("status" in payload) {
    if (!VALID_STATUS.includes(payload.status))
      throw new AppError("Status không hợp lệ", 400);
    validateStatusTransition(task.status, payload.status);
  }

  return prisma.task.update({
    where: { id: taskId },
    data: allowedFields, // ✅ safe
  });
};

// ✅ deleteTask — OWNER/MANAGER hoặc creator mới xóa được
export const deleteTask = async (taskId, userId) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });
  if (!task) throw new AppError("Task không tồn tại", 404);

  const member = await getProjectMember(task.projectId, userId); // ✅
  canDeleteTask(member.role, task, userId); // ✅

  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });

  return { message: "Xóa task thành công" };
};
