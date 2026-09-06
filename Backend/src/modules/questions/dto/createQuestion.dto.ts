export interface CreateQuestionDto {
  title?: string;
  content: string;
  isAnonymous?: boolean;
  roomId?: string;
  tagIds?: string[];
}
