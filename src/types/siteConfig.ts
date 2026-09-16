/**
 * Site config / admin log — FE global.d.ts (additive).
 */
export interface SiteConfig {
  id: string;
  isSingleton: boolean;
  siteStatus?: string;
  updatedAt: Date | string;
  heroImages?: Array<{ id: string; url: string }>;
  imageURLs?: string[];
  section?: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
}
