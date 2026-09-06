import type { QuestionStatus } from "../../../generated/prisma/client.js";

export interface UpdateQuestionDto {
  title?: string;
  category?: string;
  content?: string;
  isAnonymous?: boolean;
  status?: QuestionStatus;
  tagIds?: string[];
}
