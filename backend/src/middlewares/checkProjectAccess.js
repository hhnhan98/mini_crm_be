import prisma from "../config/prisma.js";

// Kiểm tra quyền truy cập vào dự án
export const checkProjectAccess = async (req, res, next) => {
  try {
    // Admin Bypass
    if (req.user.role === "ADMIN") {
      return next();
    }

    const userId = req.user.id;

    const projectId = req.params.projectId;
    // Validate projectId
    if (!projectId) {
      return res.status(400).json({ message: "projectId là bắt buộc" });
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        accountId: userId,
      },
    });

    if (!member) {
      return res.status(403).json({
        message: "Access denied: not a project member",
      });
    }

    req.projectMember = member;
    next();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
