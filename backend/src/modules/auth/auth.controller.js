import prisma from "../../config/prisma.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    const user = await authService.register({ email, password, name });

    return res.status(201).json({
      message: "Register success",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const result = await authService.login({ email, password });

    return res.status(200).json({
      message: "Login success",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Login failed" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email?.trim()) {
      return res.status(400).json({ message: "email query là bắt buộc" });
    }

    const users = await prisma.account.findMany({
      where: {
        email: { contains: email.trim(), mode: "insensitive" },
        deletedAt: null,
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true },
      take: 10,
    });

    return res.status(200).json({ message: "Search success", data: users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
