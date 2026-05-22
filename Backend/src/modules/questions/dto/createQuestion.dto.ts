export interface CreateQuestionDto {
  content: string;
  isAnonymous?: boolean;
  roomId?: string;
  tagIds?: string[];
}
