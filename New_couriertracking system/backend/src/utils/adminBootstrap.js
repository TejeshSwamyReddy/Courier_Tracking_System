import { ensureDefaultAdminRecord } from "../data/repository.js";

const ensureDefaultAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "System Admin";

  if (!adminEmail || !adminPassword) {
    return;
  }

  await ensureDefaultAdminRecord({
    name: adminName,
    email: adminEmail.toLowerCase(),
    password: adminPassword
  });
};

export default ensureDefaultAdmin;
