import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import dataMode, { isMongoMode } from "../config/dataMode.js";
import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import { readStore, writeStore } from "./fileStore.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const sortByCreatedAtDesc = (left, right) =>
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

const formatSafeUser = (user) => ({
  _id: user._id?.toString?.() || user._id,
  id: user._id?.toString?.() || user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const formatShipment = (shipment) => ({
  ...clone(shipment),
  _id: shipment._id?.toString?.() || shipment._id,
  userId:
    shipment.userId ||
    shipment.user?._id?.toString?.() ||
    shipment.user?.toString?.() ||
    shipment.user,
  user: shipment.user && typeof shipment.user === "object" ? formatSafeUser(shipment.user) : undefined
});

export const getDataMode = () => dataMode;

export const findAuthUserByEmail = async (email, { role } = {}) => {
  const normalizedEmail = email.toLowerCase();

  if (isMongoMode) {
    const query = { email: normalizedEmail };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query).select("+password");
    return user;
  }

  return readStore(async (store) => {
    const user = store.users.find(
      (record) =>
        record.email === normalizedEmail && (role ? record.role === role : true)
    );
    return user || null;
  });
};

export const verifyUserPassword = async (user, candidatePassword) => {
  if (!user) {
    return false;
  }

  if (isMongoMode) {
    return user.comparePassword(candidatePassword);
  }

  return bcrypt.compare(candidatePassword, user.password);
};

export const createUserRecord = async ({ name, email, password, role = "user" }) => {
  const normalizedEmail = email.toLowerCase();

  if (isMongoMode) {
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role
    });

    return formatSafeUser(user.toObject());
  }

  return writeStore(async (store) => {
    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: randomUUID(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now
    };

    store.users.push(user);
    return formatSafeUser(user);
  });
};

export const findSafeUserById = async (userId) => {
  if (isMongoMode) {
    const user = await User.findById(userId).select("-password").lean();
    return user ? formatSafeUser(user) : null;
  }

  return readStore(async (store) => {
    const user = store.users.find((record) => record._id === userId);
    return user ? formatSafeUser(user) : null;
  });
};

export const touchUserLogin = async (userId) => {
  if (isMongoMode) {
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date()
    });
    return;
  }

  await writeStore(async (store) => {
    const user = store.users.find((record) => record._id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
    }
    return null;
  });
};

export const countUsers = async (filter = {}) => {
  if (isMongoMode) {
    return User.countDocuments(filter);
  }

  return readStore(async (store) =>
    store.users.filter((user) =>
      Object.entries(filter).every(([key, value]) => user[key] === value)
    ).length
  );
};

export const ensureDefaultAdminRecord = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const existingAdmin = await findAuthUserByEmail(normalizedEmail, { role: "admin" });
  if (existingAdmin) {
    return;
  }

  await createUserRecord({
    name,
    email: normalizedEmail,
    password,
    role: "admin"
  });
};

export const createShipmentRecord = async (payload) => {
  if (isMongoMode) {
    const shipment = await Shipment.create({
      trackingId: payload.trackingId,
      user: payload.userId,
      sender: payload.sender,
      receiver: payload.receiver,
      packageWeight: payload.packageWeight,
      deliveryType: payload.deliveryType,
      price: payload.price,
      estimatedDelivery: payload.estimatedDelivery,
      status: payload.status,
      statusHistory: payload.statusHistory
    });

    return formatShipment(shipment.toObject());
  }

  return writeStore(async (store) => {
    const now = new Date().toISOString();
    const shipment = {
      _id: randomUUID(),
      trackingId: payload.trackingId,
      userId: payload.userId,
      sender: payload.sender,
      receiver: payload.receiver,
      packageWeight: payload.packageWeight,
      deliveryType: payload.deliveryType,
      price: payload.price,
      estimatedDelivery:
        payload.estimatedDelivery instanceof Date
          ? payload.estimatedDelivery.toISOString()
          : payload.estimatedDelivery,
      status: payload.status,
      statusHistory: payload.statusHistory.map((entry) => ({
        ...entry,
        timestamp:
          entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
      })),
      createdAt: now,
      updatedAt: now
    };

    store.shipments.push(shipment);
    return formatShipment(shipment);
  });
};

export const findShipmentByTrackingId = async (trackingId, { includeUser = false } = {}) => {
  const normalizedTrackingId = trackingId.toUpperCase();

  if (isMongoMode) {
    let query = Shipment.findOne({ trackingId: normalizedTrackingId });
    if (includeUser) {
      query = query.populate("user", "name email role isActive");
    }
    const shipment = await query.lean();
    if (!shipment) {
      return null;
    }
    return formatShipment({
      ...shipment,
      userId: shipment.user?._id || shipment.user
    });
  }

  return readStore(async (store) => {
    const shipment = store.shipments.find((record) => record.trackingId === normalizedTrackingId);
    if (!shipment) {
      return null;
    }

    const formatted = formatShipment(shipment);
    if (includeUser) {
      const user = store.users.find((record) => record._id === formatted.userId);
      formatted.user = user ? formatSafeUser(user) : null;
    }
    return formatted;
  });
};

export const findShipmentById = async (shipmentId, { includeUser = false } = {}) => {
  if (isMongoMode) {
    let query = Shipment.findById(shipmentId);
    if (includeUser) {
      query = query.populate("user", "name email role isActive");
    }
    const shipment = await query.lean();
    if (!shipment) {
      return null;
    }
    return formatShipment({
      ...shipment,
      userId: shipment.user?._id || shipment.user
    });
  }

  return readStore(async (store) => {
    const shipment = store.shipments.find((record) => record._id === shipmentId);
    if (!shipment) {
      return null;
    }

    const formatted = formatShipment(shipment);
    if (includeUser) {
      const user = store.users.find((record) => record._id === formatted.userId);
      formatted.user = user ? formatSafeUser(user) : null;
    }
    return formatted;
  });
};

export const listShipments = async ({
  userId,
  status,
  search,
  includeUser = false,
  limit
} = {}) => {
  if (isMongoMode) {
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receiver.name": { $regex: search, $options: "i" } }
      ];
    }

    let mongoQuery = Shipment.find(query).sort({ createdAt: -1 });

    if (limit) {
      mongoQuery = mongoQuery.limit(limit);
    }

    if (includeUser) {
      mongoQuery = mongoQuery.populate("user", "name email role isActive");
    }

    const shipments = await mongoQuery.lean();
    return shipments.map((shipment) =>
      formatShipment({
        ...shipment,
        userId: shipment.user?._id || shipment.user
      })
    );
  }

  return readStore(async (store) => {
    let shipments = store.shipments.filter((shipment) => (userId ? shipment.userId === userId : true));

    if (status) {
      shipments = shipments.filter((shipment) => shipment.status === status);
    }

    if (search) {
      const query = search.toLowerCase();
      shipments = shipments.filter(
        (shipment) =>
          shipment.trackingId.toLowerCase().includes(query) ||
          shipment.sender.name.toLowerCase().includes(query) ||
          shipment.receiver.name.toLowerCase().includes(query)
      );
    }

    shipments = shipments.sort(sortByCreatedAtDesc);

    if (limit) {
      shipments = shipments.slice(0, limit);
    }

    return shipments.map((shipment) => {
      const formatted = formatShipment(shipment);
      if (includeUser) {
        const user = store.users.find((record) => record._id === formatted.userId);
        formatted.user = user ? formatSafeUser(user) : null;
      }
      return formatted;
    });
  });
};

export const countShipments = async ({ userId, status, statuses } = {}) => {
  if (isMongoMode) {
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    if (statuses?.length) {
      query.status = { $in: statuses };
    }

    return Shipment.countDocuments(query);
  }

  return readStore(async (store) =>
    store.shipments.filter((shipment) => {
      if (userId && shipment.userId !== userId) {
        return false;
      }
      if (status && shipment.status !== status) {
        return false;
      }
      if (statuses?.length && !statuses.includes(shipment.status)) {
        return false;
      }
      return true;
    }).length
  );
};

export const updateShipmentStatusRecord = async (shipmentId, { status, statusEntry }) => {
  if (isMongoMode) {
    const shipment = await Shipment.findById(shipmentId).populate("user", "name email role isActive");
    if (!shipment) {
      return null;
    }

    shipment.status = status;
    shipment.statusHistory.push(statusEntry);
    await shipment.save();

    return formatShipment(
      shipment.toObject({
        versionKey: false
      })
    );
  }

  return writeStore(async (store) => {
    const shipment = store.shipments.find((record) => record._id === shipmentId);
    if (!shipment) {
      return null;
    }

    shipment.status = status;
    shipment.statusHistory.push({
      ...statusEntry,
      timestamp:
        statusEntry.timestamp instanceof Date
          ? statusEntry.timestamp.toISOString()
          : statusEntry.timestamp
    });
    shipment.updatedAt = new Date().toISOString();

    const formatted = formatShipment(shipment);
    const user = store.users.find((record) => record._id === formatted.userId);
    formatted.user = user ? formatSafeUser(user) : null;
    return formatted;
  });
};

export const listUsersWithShipmentCounts = async () => {
  if (isMongoMode) {
    const [users, shipmentCounts] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }).lean(),
      Shipment.aggregate([
        {
          $group: {
            _id: "$user",
            totalShipments: { $sum: 1 }
          }
        }
      ])
    ]);

    const countMap = new Map(
      shipmentCounts.map((record) => [record._id.toString(), record.totalShipments])
    );

    return users.map((user) => ({
      ...formatSafeUser(user),
      totalShipments: countMap.get(user._id.toString()) || 0
    }));
  }

  return readStore(async (store) => {
    const countMap = store.shipments.reduce((map, shipment) => {
      map.set(shipment.userId, (map.get(shipment.userId) || 0) + 1);
      return map;
    }, new Map());

    return store.users
      .slice()
      .sort(sortByCreatedAtDesc)
      .map((user) => ({
        ...formatSafeUser(user),
        totalShipments: countMap.get(user._id) || 0
      }));
  });
};

export const updateUserRecord = async (userId, { role, isActive }) => {
  if (isMongoMode) {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    if (role) {
      user.role = role;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();
    return formatSafeUser(user.toObject());
  }

  return writeStore(async (store) => {
    const user = store.users.find((record) => record._id === userId);
    if (!user) {
      return null;
    }

    if (role) {
      user.role = role;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    user.updatedAt = new Date().toISOString();
    return formatSafeUser(user);
  });
};

