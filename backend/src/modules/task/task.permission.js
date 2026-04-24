import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

// Get project member role
export const getProjectMember = async (projectId, userId) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      accountId: userId,
    },
  });

  if (!member) {
    throw new AppError("Not a project member", 403);
  }

  return member;
};

// Check if user can update task
export const canUpdateTask = (memberRole, task, userId) => {
  // Kiểm tra đầu vào
  if (!memberRole) throw new AppError("Member role is missing", 500);
  if (!task) throw new AppError("Task data is missing", 500);

  if (memberRole === "OWNER" || memberRole === "MANAGER") return true;

  // Dùng Optional Chaining cho chắc chắn
  if (task?.assigneeId === userId) return true;

  throw new AppError("Bạn không có quyền chỉnh sửa công việc này", 403);
};

// Check if user can delete task
export const canDeleteTask = (memberRole, task, userId) => {
  if (memberRole === "OWNER" || memberRole === "MANAGER") return true;
  if (task.createdById === userId) return true;
  throw new AppError("No permission to delete task", 403);
};

// Check if user can assign task
export const canAssignTask = (memberRole) => {
  if (memberRole === "OWNER" || memberRole === "MANAGER") return true;

  throw new AppError("No permission to assign task", 403);
};

// Validate project membership (shortcut)
export const ensureProjectMember = async (projectId, userId) => {
  return await getProjectMember(projectId, userId);
};
