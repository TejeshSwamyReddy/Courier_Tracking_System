import express from "express";
import { body } from "express-validator";
import {
  getCurrentUser,
  loginAdmin,
  loginUser,
  registerUser
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

const emailValidation = body("email")
  .trim()
  .isEmail()
  .withMessage("A valid email address is required.");

const passwordValidation = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long.");

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required."),
    emailValidation,
    passwordValidation
  ],
  validateRequest,
  registerUser
);

router.post("/login", [emailValidation, passwordValidation], validateRequest, loginUser);
router.post("/admin/login", [emailValidation, passwordValidation], validateRequest, loginAdmin);
router.get("/me", protect, getCurrentUser);

export default router;

