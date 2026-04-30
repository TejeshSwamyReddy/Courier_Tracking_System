# Courier Tracking System - Code Reference For Screenshots

This file is a screenshot-friendly reference for the backend and frontend structure described in the project notes.

## Backend Folder Structure

```txt
backend/
  src/
    controllers/
      adminController.js
      userController.js
      agentController.js
    db/
      config.js
    middleware/
      authMiddleware.js
      upload.js
    models/
      Admin/
        Admins.js
      User/
        Users.js
      Shipment/
        Shipments.js
        Tracking.js
      DeliveryAgent/
        Agents.js
    routes/
      adminRoutes.js
      userRoutes.js
      agentRoutes.js
    app.js
    server.js
```

## backend/src/db/config.js

```js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

## backend/src/models/Admin/Admins.js

```js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, default: "admin" }
  },
  { timestamps: true }
);

adminSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

adminSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("Admin", adminSchema);
```

## backend/src/models/User/Users.js

```js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
```

## backend/src/models/Shipment/Shipments.js

```js
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    pincode: { type: String }
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    sender: { type: addressSchema, required: true },
    receiver: { type: addressSchema, required: true },
    packageWeight: { type: Number, required: true },
    deliveryType: { type: String, enum: ["Standard", "Express", "Economy"], default: "Standard" },
    status: {
      type: String,
      enum: ["Booked", "Picked Up", "In Transit", "Out For Delivery", "Delivered", "Cancelled"],
      default: "Booked"
    },
    deliveryProof: { type: String },
    estimatedDelivery: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Shipment", shipmentSchema);
```

## backend/src/models/Shipment/Tracking.js

```js
import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema(
  {
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true },
    status: { type: String, required: true },
    location: { type: String, required: true },
    message: { type: String, default: "Shipment update recorded" },
    updatedBy: { type: String, enum: ["admin", "agent", "system"], default: "system" }
  },
  { timestamps: true }
);

export default mongoose.model("Tracking", trackingSchema);
```

## backend/src/models/DeliveryAgent/Agents.js

```js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 8, select: false },
    area: { type: String, required: true },
    assignedShipments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shipment" }],
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

agentSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

agentSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("Agent", agentSchema);
```

## backend/src/middleware/authMiddleware.js

```js
import jwt from "jsonwebtoken";
import User from "../models/User/Users.js";
import Admin from "../models/Admin/Admins.js";
import Agent from "../models/DeliveryAgent/Agents.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = decoded.role === "admin" ? Admin : decoded.role === "agent" ? Agent : User;
    req.user = await Model.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ message: "Account not found" });
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  return next();
};
```

## backend/src/middleware/upload.js

```js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
  cb(isValid ? null : new Error("Only images and PDFs are allowed"), isValid);
};

export default multer({ storage, fileFilter });
```

## backend/src/controllers/userController.js

```js
import jwt from "jsonwebtoken";
import User from "../models/User/Users.js";
import Shipment from "../models/Shipment/Shipments.js";
import Tracking from "../models/Shipment/Tracking.js";

const createToken = (id, role = "user") =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const exists = await User.findOne({ email });

  if (exists) return res.status(409).json({ message: "User already exists" });

  const user = await User.create({ name, email, password, phone, address });
  res.status(201).json({ token: createToken(user._id), user });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ token: createToken(user._id), user });
};

export const bookShipment = async (req, res) => {
  const trackingId = `CTS${Date.now()}`;
  const shipment = await Shipment.create({ ...req.body, trackingId, user: req.user._id });

  await Tracking.create({
    shipment: shipment._id,
    status: shipment.status,
    location: shipment.sender.city || "Origin Hub",
    message: "Shipment booked successfully",
    updatedBy: "system"
  });

  res.status(201).json({ message: "Shipment booked", shipment });
};

export const trackShipment = async (req, res) => {
  const shipment = await Shipment.findOne({ trackingId: req.params.trackingId });
  if (!shipment) return res.status(404).json({ message: "Tracking ID not found" });

  const updates = await Tracking.find({ shipment: shipment._id }).sort("-createdAt");
  res.json({ shipment, updates });
};

export const shipmentHistory = async (req, res) => {
  const shipments = await Shipment.find({ user: req.user._id }).sort("-createdAt");
  res.json({ shipments });
};
```

## backend/src/controllers/adminController.js

```js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin/Admins.js";
import User from "../models/User/Users.js";
import Agent from "../models/DeliveryAgent/Agents.js";
import Shipment from "../models/Shipment/Shipments.js";
import Tracking from "../models/Shipment/Tracking.js";

const createToken = (id) => jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const adminSignup = async (req, res) => {
  const admin = await Admin.create(req.body);
  res.status(201).json({ token: createToken(admin._id), admin });
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  res.json({ token: createToken(admin._id), admin });
};

export const getUsers = async (req, res) => {
  const users = await User.find().sort("-createdAt");
  res.json({ users });
};

export const getShipments = async (req, res) => {
  const shipments = await Shipment.find().populate("user agent").sort("-createdAt");
  res.json({ shipments });
};

export const assignAgent = async (req, res) => {
  const { shipmentId, agentId } = req.body;
  const shipment = await Shipment.findByIdAndUpdate(shipmentId, { agent: agentId }, { new: true });
  await Agent.findByIdAndUpdate(agentId, { $addToSet: { assignedShipments: shipmentId } });
  res.json({ message: "Agent assigned", shipment });
};

export const updateDeliveryStatus = async (req, res) => {
  const { status, location, message } = req.body;
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status }, { new: true });

  await Tracking.create({ shipment: shipment._id, status, location, message, updatedBy: "admin" });
  res.json({ message: "Delivery status updated", shipment });
};
```

## backend/src/controllers/agentController.js

```js
import jwt from "jsonwebtoken";
import Agent from "../models/DeliveryAgent/Agents.js";
import Shipment from "../models/Shipment/Shipments.js";
import Tracking from "../models/Shipment/Tracking.js";

const createToken = (id) => jwt.sign({ id, role: "agent" }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const agentLogin = async (req, res) => {
  const { email, password } = req.body;
  const agent = await Agent.findOne({ email }).select("+password");

  if (!agent || !(await agent.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid agent credentials" });
  }

  res.json({ token: createToken(agent._id), agent });
};

export const getAssignedShipments = async (req, res) => {
  const shipments = await Shipment.find({ agent: req.user._id }).sort("-createdAt");
  res.json({ shipments });
};

export const updateAssignedShipmentStatus = async (req, res) => {
  const { status, location, message } = req.body;
  const shipment = await Shipment.findOneAndUpdate(
    { _id: req.params.id, agent: req.user._id },
    { status, deliveryProof: req.file?.path },
    { new: true }
  );

  if (!shipment) return res.status(404).json({ message: "Assigned shipment not found" });

  await Tracking.create({ shipment: shipment._id, status, location, message, updatedBy: "agent" });
  res.json({ message: "Status updated", shipment });
};
```

## backend/src/routes/userRoutes.js

```js
import express from "express";
import { bookShipment, loginUser, registerUser, shipmentHistory, trackShipment } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/shipments", protect, bookShipment);
router.get("/shipments/history", protect, shipmentHistory);
router.get("/track/:trackingId", trackShipment);

export default router;
```

## backend/src/routes/adminRoutes.js

```js
import express from "express";
import { adminLogin, adminSignup, assignAgent, getShipments, getUsers, updateDeliveryStatus } from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/users", protect, authorize("admin"), getUsers);
router.get("/shipments", protect, authorize("admin"), getShipments);
router.post("/assign-agent", protect, authorize("admin"), assignAgent);
router.patch("/shipments/:id/status", protect, authorize("admin"), updateDeliveryStatus);

export default router;
```

## backend/src/routes/agentRoutes.js

```js
import express from "express";
import { agentLogin, getAssignedShipments, updateAssignedShipmentStatus } from "../controllers/agentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/login", agentLogin);
router.get("/assigned", protect, authorize("agent"), getAssignedShipments);
router.patch("/shipments/:id/status", protect, authorize("agent"), upload.single("proof"), updateAssignedShipmentStatus);

export default router;
```

## Frontend Folder Structure

```txt
frontend/
  src/
    Admin/
      Ahome.jsx
      Alogin.jsx
      Asignup.jsx
      Anavbar.jsx
      Users.jsx
      Shipments.jsx
      Agents.jsx
      Orders.jsx
    User/
      Uhome.jsx
      Ulogin.jsx
      Usignup.jsx
      Unavbar.jsx
      BookShipment.jsx
      TrackShipment.jsx
      ShipmentHistory.jsx
      ShipmentItem.jsx
    Components/
      Navbar.jsx
      Footer.jsx
      Home.jsx
      ui/
        Button.jsx
        Input.jsx
```

## frontend/src/Components/Navbar.jsx

```jsx
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">CourierTrack</Link>
      <div className="nav-links">
        <Link to="/track">Track</Link>
        <Link to="/login">User Login</Link>
        <Link to="/admin/login">Admin</Link>
      </div>
    </nav>
  );
};

export default Navbar;
```

## frontend/src/Components/Footer.jsx

```jsx
const Footer = () => {
  return (
    <footer className="footer">
      <p>CourierTrack - Fast, safe, and transparent courier delivery.</p>
    </footer>
  );
};

export default Footer;
```

## frontend/src/Components/Home.jsx

```jsx
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Home = () => {
  return (
    <>
      <Navbar />
      <main className="home-page">
        <section className="hero">
          <h1>Track every courier from booking to doorstep.</h1>
          <p>Book shipments, monitor delivery progress, and manage courier operations in one system.</p>
          <div className="hero-actions">
            <Link to="/signup">Book Shipment</Link>
            <Link to="/track">Track Package</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
```

## frontend/src/Admin/Alogin.jsx

```jsx
import { useState } from "react";

const Alogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    localStorage.setItem("adminToken", data.token);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <h2>Admin Login</h2>
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Login</button>
    </form>
  );
};

export default Alogin;
```

## frontend/src/Admin/Ahome.jsx

```jsx
const Ahome = () => {
  return (
    <section className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <article>Total Users: 120</article>
        <article>Total Shipments: 430</article>
        <article>Delivered: 310</article>
        <article>Pending: 45</article>
      </div>
    </section>
  );
};

export default Ahome;
```

## frontend/src/Admin/Shipments.jsx

```jsx
const Shipments = ({ shipments = [] }) => {
  return (
    <section>
      <h2>Manage Shipments</h2>
      <table>
        <thead>
          <tr>
            <th>Tracking ID</th>
            <th>Receiver</th>
            <th>Status</th>
            <th>Agent</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment._id}>
              <td>{shipment.trackingId}</td>
              <td>{shipment.receiver.name}</td>
              <td>{shipment.status}</td>
              <td>{shipment.agent?.name || "Not Assigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default Shipments;
```

## frontend/src/User/Ulogin.jsx

```jsx
import { useState } from "react";

const Ulogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    localStorage.setItem("userToken", data.token);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <h2>User Login</h2>
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Login</button>
    </form>
  );
};

export default Ulogin;
```

## frontend/src/User/BookShipment.jsx

```jsx
import { useState } from "react";

const BookShipment = () => {
  const [form, setForm] = useState({ packageWeight: "", deliveryType: "Standard" });

  const bookShipment = async (event) => {
    event.preventDefault();
    await fetch("/api/users/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      },
      body: JSON.stringify(form)
    });
  };

  return (
    <form onSubmit={bookShipment} className="shipment-form">
      <h2>Book New Shipment</h2>
      <input placeholder="Package Weight" onChange={(e) => setForm({ ...form, packageWeight: e.target.value })} />
      <select onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}>
        <option>Standard</option>
        <option>Express</option>
        <option>Economy</option>
      </select>
      <button type="submit">Book Shipment</button>
    </form>
  );
};

export default BookShipment;
```

## frontend/src/User/TrackShipment.jsx

```jsx
import { useState } from "react";

const TrackShipment = () => {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);

  const track = async (event) => {
    event.preventDefault();
    const response = await fetch(`/api/users/track/${trackingId}`);
    const data = await response.json();
    setResult(data);
  };

  return (
    <section className="track-page">
      <form onSubmit={track}>
        <h2>Track Shipment</h2>
        <input placeholder="Enter tracking ID" onChange={(e) => setTrackingId(e.target.value)} />
        <button type="submit">Track</button>
      </form>

      {result?.shipment && (
        <article className="tracking-card">
          <h3>{result.shipment.trackingId}</h3>
          <p>Status: {result.shipment.status}</p>
          <p>Receiver: {result.shipment.receiver.name}</p>
        </article>
      )}
    </section>
  );
};

export default TrackShipment;
```

## frontend/src/User/ShipmentItem.jsx

```jsx
const ShipmentItem = ({ shipment }) => {
  return (
    <article className="shipment-item">
      <h3>{shipment.trackingId}</h3>
      <p>Receiver: {shipment.receiver.name}</p>
      <p>Status: {shipment.status}</p>
      <p>Delivery Type: {shipment.deliveryType}</p>
    </article>
  );
};

export default ShipmentItem;
```

## frontend/src/User/ShipmentHistory.jsx

```jsx
import ShipmentItem from "./ShipmentItem";

const ShipmentHistory = ({ shipments = [] }) => {
  return (
    <section>
      <h2>Shipment History</h2>
      {shipments.length === 0 ? (
        <p>No shipments found.</p>
      ) : (
        shipments.map((shipment) => <ShipmentItem key={shipment._id} shipment={shipment} />)
      )}
    </section>
  );
};

export default ShipmentHistory;
```
