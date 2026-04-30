import {
  createUserRecord,
  findAuthUserByEmail,
  touchUserLogin,
  verifyUserPassword
} from "../data/repository.js";
import generateToken from "../utils/generateToken.js";

const formatAuthResponse = (user) => ({
  token: generateToken(user),
  user: {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }
});

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await findAuthUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409);
      throw new Error("An account with this email already exists.");
    }

    const user = await createUserRecord({
      name,
      email: normalizedEmail,
      password
    });

    return res.status(201).json(formatAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findAuthUserByEmail(email);

    if (!user || !(await verifyUserPassword(user, password))) {
      res.status(401);
      throw new Error("Invalid email or password.");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account has been disabled. Contact support.");
    }

    if (user.role === "admin") {
      res.status(403);
      throw new Error("Administrator accounts must use the admin login page.");
    }

    await touchUserLogin(user._id || user.id);

    return res.json(formatAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findAuthUserByEmail(email, { role: "admin" });

    if (!user || !(await verifyUserPassword(user, password))) {
      res.status(401);
      throw new Error("Invalid administrator credentials.");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("This administrator account is disabled.");
    }

    await touchUserLogin(user._id || user.id);

    return res.json(formatAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res) =>
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive
    }
  });

export { registerUser, loginUser, loginAdmin, getCurrentUser };
