import { Prisma } from "../../generated/prisma/client.js";
import { BadRequestError } from "../errors/BadRequestError.js";

export const mapPrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      const model = error.meta?.modelName as string | undefined;
      const message =
        model === "Room"
          ? "Cannot remove this room because it still has linked messages or questions."
          : "Cannot remove this record because it is still referenced by other data.";

      throw new BadRequestError(message);
    }

    if (error.code === "P2025") {
      throw new BadRequestError("Record not found");
    }
  }

  throw error;
};
