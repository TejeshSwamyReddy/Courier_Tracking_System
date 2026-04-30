import mongoose from "mongoose";
import {
  DELIVERY_TYPES,
  SHIPMENT_STATUSES
} from "../utils/shipmentCalculations.js";

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: SHIPMENT_STATUSES,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    updatedByRole: {
      type: String,
      default: "system"
    },
    location: {
      type: String,
      default: "Origin Hub"
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sender: {
      type: partySchema,
      required: true
    },
    receiver: {
      type: partySchema,
      required: true
    },
    packageWeight: {
      type: Number,
      required: true,
      min: 0.1
    },
    deliveryType: {
      type: String,
      enum: DELIVERY_TYPES,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: SHIPMENT_STATUSES,
      default: "Order Placed"
    },
    estimatedDelivery: {
      type: Date,
      required: true
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Shipment = mongoose.model("Shipment", shipmentSchema);

export default Shipment;

