import type { QuestionStatus } from "../../../generated/prisma/client.js";

export interface UpdateQuestionDto {
  content?: string;
  isAnonymous?: boolean;
  status?: QuestionStatus;
  tagIds?: string[];
}
