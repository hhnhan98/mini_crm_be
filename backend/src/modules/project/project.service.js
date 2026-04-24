import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

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

    // auto add owner
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
  const memberships = await prisma.projectMember.findMany({
    where: { accountId: userId },
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
    orderBy: { createdAt: "desc" },
  });

  return memberships.map((m) => m.project);
};

// GET PROJECT DETAIL
export const getProjectDetail = async (projectId, userId) => {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, accountId: userId },
  });

  if (!member) {
    throw new AppError("Access denied", 403);
  }

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      members: {
        select: {
          role: true,
          account: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          // dueDate: true,
        },
        take: 10,
      },
    },
  });
};
