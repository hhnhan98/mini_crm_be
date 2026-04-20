import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const ROLES = ["OWNER", "MANAGER", "MEMBER"];

const normalizeRole = (role) => {
  if (!role) {
    throw new AppError("Role is required", 400);
  }

  const clean = role.trim().toUpperCase();

  if (!ROLES.includes(clean)) {
    throw new AppError("Invalid role", 400);
  }

  return clean;
};

// CREATE PROJECT
export const createProject = async ({ name, description, userId }) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        description,
        createdById: userId,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        accountId: userId,
        role: "OWNER",
      },
    });

    return project;
  });
};

// GET MY PROJECTS
export const getMyProjects = async (userId) => {
  return prisma.projectMember.findMany({
    where: {
      accountId: userId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// GET PROJECT DETAIL
export const getProjectDetail = async (projectId, userId) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      accountId: userId,
    },
  });

  if (!member) {
    throw new AppError("Access denied", 403);
  }

  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
        take: 10,
      },
    },
  });
};

// GET MEMBERS (pagination)
export const getMembers = async (projectId, { page, limit }, userId) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      accountId: userId,
    },
  });

  if (!member) {
    throw new AppError("Access denied", 403);
  }

  const skip = (page - 1) * limit;

  return prisma.projectMember.findMany({
    where: {
      projectId,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
    include: {
      account: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
    },
  });
};

// ADD MEMBER
export const addMember = async ({
  projectId,
  accountId,
  role,
  currentUser,
}) => {
  const user = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const currentMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      accountId: currentUser.id,
    },
  });

  if (!currentMember) {
    throw new AppError("Access denied", 403);
  }

  if (currentMember.role === "MEMBER") {
    throw new AppError("Permission denied", 403);
  }

  const existing = await prisma.projectMember.findFirst({
    where: {
      projectId,
      accountId,
    },
  });

  if (existing) {
    throw new AppError("User already in project", 409);
  }

  const cleanRole = normalizeRole(role);

  return prisma.projectMember.create({
    data: {
      projectId,
      accountId,
      role: cleanRole,
    },
  });
};
