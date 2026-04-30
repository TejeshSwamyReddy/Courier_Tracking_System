import express from "express";
import { body } from "express-validator";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  trackShipment
} from "../controllers/shipmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

const partyValidation = (party) => [
  body(`${party}.name`).trim().notEmpty().withMessage(`${party} name is required.`),
  body(`${party}.phone`).trim().notEmpty().withMessage(`${party} phone is required.`),
  body(`${party}.address`).trim().notEmpty().withMessage(`${party} address is required.`),
  body(`${party}.email`)
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage(`${party} email must be valid.`)
];

router.get("/track/:trackingId", trackShipment);
router.post(
  "/",
  protect,
  [
    ...partyValidation("sender"),
    ...partyValidation("receiver"),
    body("packageWeight")
      .isFloat({ min: 0.1 })
      .withMessage("Package weight must be at least 0.1 kg."),
    body("deliveryType")
      .isIn(["Express", "Standard", "Economy"])
      .withMessage("Delivery type must be Express, Standard, or Economy.")
  ],
  validateRequest,
  createShipment
);
router.get("/mine", protect, getMyShipments);
router.get("/:shipmentId", protect, getShipmentById);

export default router;

