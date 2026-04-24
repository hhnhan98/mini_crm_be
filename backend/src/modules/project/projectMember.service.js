import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

/**
 * ROLES
 */
const ROLES = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
};

const ADDABLE_ROLES = [ROLES.MANAGER, ROLES.MEMBER];

/**
 * helpers
 */
const getProjectMember = async (projectId, accountId) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_accountId: {
        projectId,
        accountId,
      },
    },
  });
};

const ensureUserExists = async (accountId) => {
  const user = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!user) throw new AppError("User not found", 404);

  return user;
};

const validateRole = (role) => {
  if (!ADDABLE_ROLES.includes(role)) {
    throw new AppError("Invalid role", 400);
  }
};

const ensurePermission = (currentMember, targetRole) => {
  if (!currentMember) throw new AppError("Access denied", 403);

  if (currentMember.role === ROLES.MEMBER) {
    throw new AppError("Permission denied", 403);
  }

  if (currentMember.role === ROLES.MANAGER && targetRole !== ROLES.MEMBER) {
    throw new AppError("Manager can only assign MEMBER", 403);
  }
};

/**
 * ADD MEMBER
 */
export const addMember = async ({
  projectId,
  accountId,
  role,
  currentUser,
}) => {
  const cleanRole = role.trim().toUpperCase();

  validateRole(cleanRole);
  await ensureUserExists(accountId);

  const existing = await getProjectMember(projectId, accountId);
  if (existing) throw new AppError("User already in project", 409);

  const currentMember = await getProjectMember(projectId, currentUser.id);

  ensurePermission(currentMember, cleanRole);

  return prisma.projectMember.create({
    data: {
      projectId,
      accountId,
      role: cleanRole,
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * GET MEMBERS (FOR DROPDOWN + TASK ASSIGN)
 */
export const getMembers = async (projectId) => {
  return prisma.projectMember.findMany({
    where: {
      projectId,
      account: { deletedAt: null },
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

/**
 * UPDATE ROLE
 */
export const updateMemberRole = async ({
  projectId,
  accountId,
  role,
  currentUser,
}) => {
  const cleanRole = role.trim().toUpperCase();

  validateRole(cleanRole);

  const target = await getProjectMember(projectId, accountId);
  if (!target) throw new AppError("Member not found", 404);

  if (target.role === ROLES.OWNER) {
    throw new AppError("Cannot update OWNER", 400);
  }

  const currentMember = await getProjectMember(projectId, currentUser.id);

  ensurePermission(currentMember, cleanRole);

  return prisma.projectMember.update({
    where: {
      projectId_accountId: {
        projectId,
        accountId,
      },
    },
    data: {
      role: cleanRole,
    },
  });
};

/**
 * REMOVE MEMBER
 */
export const removeMember = async ({ projectId, accountId, currentUser }) => {
  const target = await getProjectMember(projectId, accountId);
  if (!target) throw new AppError("Member not found", 404);

  if (target.role === ROLES.OWNER) {
    throw new AppError("Cannot remove OWNER", 400);
  }

  if (accountId === currentUser.id) {
    throw new AppError("Cannot remove yourself", 400);
  }

  const currentMember = await getProjectMember(projectId, currentUser.id);

  ensurePermission(currentMember, target.role);

  return prisma.projectMember.delete({
    where: {
      projectId_accountId: {
        projectId,
        accountId,
      },
    },
  });
};
