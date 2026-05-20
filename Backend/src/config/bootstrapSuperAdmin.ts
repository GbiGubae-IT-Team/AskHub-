import { randomUUID } from "node:crypto";
import { UserRole } from "../generated/prisma/client.js";
import { env } from "./env.js";
import prisma from "./db.js";
import { passwordService } from "../core/utils/hashPassword.js";

export const bootstrapSuperAdmin = async () => {
  const { email, password } = env.superAdmin;

  if (!email || !password) {
    console.warn(
      "[bootstrap] SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are not set — skipping super admin sync",
    );
    return;
  }

  const hashedPassword = await passwordService.hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        deletedAt: null,
      },
    });
    console.log(`[bootstrap] Super admin synced: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      anonymousId: `anon_super_${randomUUID()}`,
    },
  });

  console.log(`[bootstrap] Super admin created: ${email}`);
};
