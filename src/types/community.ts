/*
 * Community types returned by API
 */
export type TagStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface PostImage {
  id: string;
  url: string;
  altText?: string | null;
  order?: number | null;
  userId?: string | null;
  communityPostId?: string | null;
  createdAt: string;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
}

export interface PostCreator {
  id: string;
  userName: string;
  imageUrl?: string | null;
}

export interface CommunityPostTag {
  id?: string;
  postId: string;
  taggedUserId: string;
  status: TagStatus;
  taggedAt: string;
  taggedUser?: {
    id: string;
    userName: string;
    imageUrl?: string | null;
  } | null;
}

export interface CommunityPostReaction {
  postId: string;
  userId: string;
  reactedAt: string;
}

export interface CommunityPost {
  id: string;
  creatorUserId: string;
  userTripPlanId?: string | null;
  caption?: string | null;
  isActive: boolean;
  wowCount: number;
  takedownRequestedBy?: string | null;
  takedownRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: PostImage[];
  tags: CommunityPostTag[];
  creator: PostCreator;
  userHasReacted?: boolean;
}

export interface PaginatedPosts {
  results: CommunityPost[];
  total: number;
  page: number;
  limit: number;
}

// Request bodies
export interface CreatePostBody {
  userTripPlanId?: string;
  caption?: string;
}

export interface UpdatePostImagesBody {
  images: Array<{
    url: string;
    order?: number;
    altText?: string;
  }>;
}

export interface TagUserBody {
  taggedUserId: string;
}

export interface TagResponseBody {
  response: 'ACCEPTED' | 'DECLINED';
}

export type ReactResponse = { wowCount: number };
