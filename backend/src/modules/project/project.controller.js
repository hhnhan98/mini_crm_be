import * as projectService from "./project.service.js";

// helper: parse pagination
const parsePagination = (page, limit) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));

  return { page: pageNumber, limit: limitNumber };
};

// CREATE PROJECT
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const cleanName = name?.trim();

    if (!cleanName) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await projectService.createProject({
      name: cleanName,
      description: description?.trim() || null,
      userId,
    });

    return res.status(201).json({
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET MY PROJECTS
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await projectService.getMyProjects(userId);

    return res.status(200).json({
      message: "Get my projects successfully",
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET PROJECT DETAIL
export const getProjectDetail = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    const project = await projectService.getProjectDetail(
      projectId,
      req.user.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Get project detail successfully",
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET MEMBERS
export const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page, limit } = req.query;

    if (!projectId) {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    const { page: pageNumber, limit: limitNumber } = parsePagination(
      page,
      limit
    );

    const members = await projectService.getMembers(
      projectId,
      {
        page: pageNumber,
        limit: limitNumber,
      },
      req.user.id
    );

    return res.status(200).json({
      message: "Get project members successfully",
      data: members,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ADD MEMBER
export const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { accountId, role } = req.body;

    if (!projectId) {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    if (!accountId || !role) {
      return res.status(400).json({
        message: "accountId and role are required",
      });
    }
    const cleanRole = role.trim().toUpperCase();

    const allowedRoles = ["OWNER", "MEMBER"];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const member = await projectService.addMember({
      projectId,
      accountId,
      role: cleanRole,
      currentUser: req.user,
    });

    return res.status(201).json({
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    if (error.message === "User already in project") {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
