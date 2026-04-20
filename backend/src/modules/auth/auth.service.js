import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SystemRole } from "@prisma/client";

// Register function
export const register = async ({ email, password, name }) => {
  const existingUser = await prisma.account.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_ROUNDS) || 10
  );

  const user = await prisma.account.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: SystemRole.USER,
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    ...userWithoutPassword,
    role: user.role, // đảm bảo rằng FE không bị thiếu context user
  };
};

// Login function
export const login = async ({ email, password }) => {
  const user = await prisma.account.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1d" }
  );

  return {
    accessToken: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};
