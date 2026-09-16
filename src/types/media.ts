/**
 * Shared media / review / category types from FE global.d.ts (additive).
 */

export interface Image {
  id: string;
  url: string;
  altText?: string | null;
  order?: number | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  uploadedAt?: Date | string;
  createdAt?: Date | string;
  userId?: string | null;
  tourSpotId?: string;
  activitySpotId?: string;
  hotelId?: string;
  hotelRoomTypeId?: string;
  transportId?: string;
  guideId?: string;
  communityPostId?: string | null;
  section?: string;
}

export interface HeroSectionImage {
  id: string;
  url: string;
  altText?: string;
  order?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  section: string;
  siteConfigId: string;
}

export interface Review {
  id: string;
  reviewType: string;
  reviewAssetId?: string;
  title?: string;
  description?: string;
  comment?: string | null;
  rating: number;
  userId?: string;
  tourSpotId?: string;
  activitySpotId?: string;
  hotelId?: string;
  transportId?: string;
  guideId?: string;
  createdAt?: Date | string;
  user?: {
    id: string;
    userName: string;
    imageUrl?: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  type: string;
  slug: string;
  isActive: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookmarkType: string;
  targetId: string;
  createdAt?: Date | string;
}
