import type { Prisma, UserRole } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async updateUserRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  },
};
