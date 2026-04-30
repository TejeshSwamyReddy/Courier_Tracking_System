export const DELIVERY_TYPES = ["Express", "Standard", "Economy"];
export const SHIPMENT_STATUSES = [
  "Order Placed",
  "Picked Up",
  "In Transit",
  "Delivered"
];

const RATE_PER_KG = {
  Express: 130,
  Standard: 95,
  Economy: 70
};

const BASE_FEE = {
  Express: 160,
  Standard: 110,
  Economy: 80
};

const ETA_DAYS = {
  Express: 1,
  Standard: 3,
  Economy: 5
};

const STATUS_MESSAGES = {
  "Order Placed": "Your booking has been received and is being prepared for pickup.",
  "Picked Up": "The package has been picked up from the sender.",
  "In Transit": "The package is moving through the courier network.",
  "Delivered": "The package has been delivered to the receiver."
};

export const calculateShipmentPrice = (weight, deliveryType) => {
  const safeWeight = Math.max(Number(weight || 0), 0.5);
  return Math.round(BASE_FEE[deliveryType] + safeWeight * RATE_PER_KG[deliveryType]);
};

export const calculateEstimatedDelivery = (deliveryType) => {
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + ETA_DAYS[deliveryType]);
  return estimatedDate;
};

export const buildStatusEntry = ({
  status,
  updatedByRole = "system",
  message,
  location = "Origin Hub"
}) => ({
  status,
  message: message || STATUS_MESSAGES[status] || "Shipment status updated.",
  updatedByRole,
  location,
  timestamp: new Date()
});

