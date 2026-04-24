export const checkProjectRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Admin Bypass
      if (req.user.role === "ADMIN") {
        return next();
      }

      const member = req.projectMember;

      if (!member) {
        return res.status(403).json({
          message: "You are not in this project",
        });
      }

      if (allowedRoles.length && !allowedRoles.includes(member.role)) {
        return res.status(403).json({
          message: "Permission denied",
        });
        w;
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Check role failed",
      });
    }
  };
};
