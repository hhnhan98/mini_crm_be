import * as projectService from "./project.service.js";
import * as projectMemberService from "./projectMember.service.js";

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
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

// GET MY PROJECTS
export const getMyProjects = async (req, res) => {
  try {
    const projects = await projectService.getMyProjects(req.user.id);

    return res.status(200).json({
      message: "Get projects successfully",
      data: projects,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
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

    return res.status(200).json({
      message: "Get project detail successfully",
      data: project,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

// GET MEMBERS
export const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const members = await projectMemberService.getMembers(projectId);

    return res.status(200).json({
      message: "Get project members successfully",
      data: members,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

// ADD MEMBER
export const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { accountId, role } = req.body;

    if (!projectId || !accountId || !role) {
      return res.status(400).json({
        message: "projectId, accountId, role are required",
      });
    }

    const member = await projectMemberService.addMember({
      projectId,
      accountId,
      role: role.trim().toUpperCase(),
      currentUser: req.user,
    });

    return res.status(201).json({
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};
