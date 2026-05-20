import { Prisma } from "../../generated/prisma/client.js";
import { BadRequestError } from "../errors/BadRequestError.js";

export const mapPrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      throw new BadRequestError(
        "Cannot remove this user because they still have linked questions, answers, messages, votes, notifications, or rooms.",
      );
    }

    if (error.code === "P2025") {
      throw new BadRequestError("Record not found");
    }
  }

  throw error;
};
