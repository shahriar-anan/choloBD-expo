/**
 * Complaint types — FE global.d.ts (additive).
 */
export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  addressedTo: string;
  targetType?: string | null;
  targetEntityId?: string | null;
  targetEntityName?: string | null;
  complainantUserId: string;
  complainantName?: string | null;
  adminResponse?: string | null;
  resolvedByUserId?: string | null;
  resolvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  complainant?: {
    id: string;
    userName?: string | null;
    email?: string;
    imageUrl?: string | null;
  };
  target?: unknown | null;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  authorUserId: string;
  authorName?: string | null;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: {
    id: string;
    userName?: string | null;
    imageUrl?: string | null;
    role?: string;
  };
}
