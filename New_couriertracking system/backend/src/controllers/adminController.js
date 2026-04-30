import { sendShipmentEmail } from "../utils/emailService.js";
import {
  SHIPMENT_STATUSES,
  buildStatusEntry
} from "../utils/shipmentCalculations.js";
import {
  countShipments,
  countUsers,
  listShipments,
  listUsersWithShipmentCounts,
  updateShipmentStatusRecord,
  updateUserRecord
} from "../data/repository.js";

const getDashboardData = async (req, res, next) => {
  try {
    const [
      totalShipments,
      activeShipments,
      deliveredShipments,
      totalUsers,
      recentShipments
    ] = await Promise.all([
      countShipments(),
      countShipments({ statuses: ["Order Placed", "Picked Up", "In Transit"] }),
      countShipments({ status: "Delivered" }),
      countUsers({ role: "user" }),
      listShipments({ includeUser: true, limit: 5 })
    ]);

    return res.json({
      metrics: {
        totalShipments,
        activeShipments,
        deliveredShipments,
        totalUsers
      },
      recentShipments
    });
  } catch (error) {
    return next(error);
  }
};

const getAllShipments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const shipments = await listShipments({
      status: status && SHIPMENT_STATUSES.includes(status) ? status : undefined,
      search,
      includeUser: true
    });

    return res.json({ shipments });
  } catch (error) {
    return next(error);
  }
};

const updateShipmentStatus = async (req, res, next) => {
  try {
    const { status, message, location } = req.body;
    const shipment = await updateShipmentStatusRecord(req.params.shipmentId, {
      status,
      statusEntry: buildStatusEntry({
        status,
        message,
        location: location || "Distribution Hub",
        updatedByRole: "admin"
      })
    });

    if (!shipment) {
      res.status(404);
      throw new Error("Shipment not found.");
    }

    await sendShipmentEmail({
      to: shipment.sender.email || shipment.receiver.email || shipment.user?.email,
      subject: `Shipment update - ${shipment.trackingId}`,
      trackingId: shipment.trackingId,
      status,
      message: message || `Your shipment is now marked as ${status}.`
    });

    return res.json({
      message: "Shipment status updated successfully.",
      shipment
    });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await listUsersWithShipmentCounts();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await updateUserRecord(req.params.userId, { role, isActive });

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    return res.json({
      message: "User updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    return next(error);
  }
};

export {
  getDashboardData,
  getAllShipments,
  updateShipmentStatus,
  getUsers,
  updateUser
};
