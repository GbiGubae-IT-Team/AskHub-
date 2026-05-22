export type TagRecord = {
  id: string;
  name: string;
};

export interface TagResponse {
  id: string;
  name: string;
}

export interface ListTagsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedTagsResponse {
  items: TagResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toTagResponse = (tag: TagRecord): TagResponse => ({
  id: tag.id,
  name: tag.name,
});
