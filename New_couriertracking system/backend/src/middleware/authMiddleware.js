import jwt from "jsonwebtoken";
import { findSafeUserById } from "../data/repository.js";

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401);
    return next(new Error("Authentication required."));
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findSafeUserById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401);
      return next(new Error("User is inactive or no longer exists."));
    }

    req.user = user;
    return next();
  } catch (error) {
    res.status(401);
    return next(new Error("Invalid or expired token."));
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    return next(new Error("Administrator access required."));
  }

  return next();
};

export { protect, adminOnly };
