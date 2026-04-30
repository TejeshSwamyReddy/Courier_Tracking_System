import generateTrackingId from "../utils/generateTrackingId.js";
import { sendShipmentEmail } from "../utils/emailService.js";
import {
  buildStatusEntry,
  calculateEstimatedDelivery,
  calculateShipmentPrice
} from "../utils/shipmentCalculations.js";
import {
  createShipmentRecord,
  findShipmentById,
  findShipmentByTrackingId,
  listShipments
} from "../data/repository.js";

const createUniqueTrackingId = async () => {
  let trackingId = generateTrackingId();
  let existingShipment = await findShipmentByTrackingId(trackingId);

  while (existingShipment) {
    trackingId = generateTrackingId();
    existingShipment = await findShipmentByTrackingId(trackingId);
  }

  return trackingId;
};

const createShipment = async (req, res, next) => {
  try {
    const { sender, receiver, packageWeight, deliveryType } = req.body;

    const trackingId = await createUniqueTrackingId();
    const shipment = await createShipmentRecord({
      trackingId,
      userId: req.user.id,
      sender,
      receiver,
      packageWeight,
      deliveryType,
      price: calculateShipmentPrice(packageWeight, deliveryType),
      estimatedDelivery: calculateEstimatedDelivery(deliveryType),
      status: "Order Placed",
      statusHistory: [buildStatusEntry({ status: "Order Placed", updatedByRole: "user" })]
    });

    await sendShipmentEmail({
      to: sender.email || receiver.email,
      subject: `Shipment booked successfully - ${trackingId}`,
      trackingId,
      status: shipment.status,
      message: "Your courier booking has been confirmed."
    });

    return res.status(201).json({
      message: "Shipment created successfully.",
      shipment
    });
  } catch (error) {
    return next(error);
  }
};

const getMyShipments = async (req, res, next) => {
  try {
    const shipments = await listShipments({ userId: req.user.id });

    return res.json({ shipments });
  } catch (error) {
    return next(error);
  }
};

const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await findShipmentById(req.params.shipmentId, {
      includeUser: true
    });

    if (!shipment) {
      res.status(404);
      throw new Error("Shipment not found.");
    }

    const isOwner = shipment.userId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("You do not have permission to view this shipment.");
    }

    return res.json({ shipment });
  } catch (error) {
    return next(error);
  }
};

const trackShipment = async (req, res, next) => {
  try {
    const shipment = await findShipmentByTrackingId(req.params.trackingId.toUpperCase());

    if (!shipment) {
      res.status(404);
      throw new Error("Tracking ID not found.");
    }

    return res.json({ shipment });
  } catch (error) {
    return next(error);
  }
};

export { createShipment, getMyShipments, getShipmentById, trackShipment };
