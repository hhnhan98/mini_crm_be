import express from "express";
import * as authController from "./auth.controller.js";

const router = express.Router();

// REGISTER & LOGIN
router.post("/register", authController.register);
router.post("/login", authController.login);

// SEARCH USERS
router.get("/users/search", authController.searchUsers);

export default router;
