import express from "express";
import * as projectController from "./project.controller.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { checkProjectRole } from "../../middlewares/checkProjectRole.js";
import { checkProjectAccess } from "../../middlewares/checkProjectAccess.js";

const router = express.Router();

router.use(verifyToken);

// GET MY PROJECTS
router.get("/", projectController.getMyProjects);

// CREATE PROJECT
router.post("/", projectController.createProject);

// GET MEMBERS
router.get(
  "/:projectId/members",
  checkProjectAccess,
  projectController.getMembers
);

// ADD MEMBER
router.post(
  "/:projectId/members",
  checkProjectAccess,
  checkProjectRole(["OWNER"]),
  projectController.addMember
);

// GET PROJECT DETAIL
router.get(
  "/:projectId",
  checkProjectAccess,
  checkProjectRole(["OWNER", "MEMBER"]),
  projectController.getProjectDetail
);

export default router;
