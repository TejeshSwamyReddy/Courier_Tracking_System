import express from "express";
import { body } from "express-validator";
import {
  getAllShipments,
  getDashboardData,
  getUsers,
  updateShipmentStatus,
  updateUser
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardData);
router.get("/shipments", getAllShipments);
router.patch(
  "/shipments/:shipmentId/status",
  [
    body("status")
      .isIn(["Order Placed", "Picked Up", "In Transit", "Delivered"])
      .withMessage("A valid shipment status is required."),
    body("message").optional().trim().isLength({ min: 3 }).withMessage("Message is too short."),
    body("location")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Location is too short.")
  ],
  validateRequest,
  updateShipmentStatus
);
router.get("/users", getUsers);
router.patch(
  "/users/:userId",
  [
    body("role")
      .optional()
      .isIn(["user", "admin"])
      .withMessage("Role must be user or admin."),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false.")
  ],
  validateRequest,
  updateUser
);

export default router;

