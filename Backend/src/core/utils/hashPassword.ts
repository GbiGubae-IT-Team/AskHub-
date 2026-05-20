import bcrypt from "bcryptjs";

export const passwordService = {
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  },

  async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  },
};
