/**
 * Notification — FE global.d.ts (additive).
 */
export interface Notification {
  id: string;
  content: string;
  isRead: boolean;
  notificationPriority: string;
  notificationAudience: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  userId: string;
  createdAt: Date | string;
  readAt?: Date | string | null;
}
