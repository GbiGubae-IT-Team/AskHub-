import { Prisma } from "../../generated/prisma/client.js";
import { BadRequestError } from "../errors/BadRequestError.js";

export const mapPrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      const model = error.meta?.modelName as string | undefined;
      const messages: Record<string, string> = {
        Room:
          "Cannot remove this room because it still has linked messages or questions.",
        Question:
          "Cannot remove this question because it still has linked answers, votes, or tags.",
        Message:
          "Cannot remove this message because it is still referenced by other data.",
        Tag:
          "Cannot remove this tag because it is still linked to one or more questions.",
        Answer:
          "Cannot remove this answer because it is still referenced by other data.",
        User:
          "Cannot remove this user because they still have linked questions, answers, messages, votes, notifications, or rooms.",
      };

      const message =
        model && messages[model]
          ? messages[model]
          : "Cannot remove this record because it is still referenced by other data.";

      throw new BadRequestError(message);
    }

    if (error.code === "P2025") {
      throw new BadRequestError("Record not found");
    }
  }

  throw error;
};
