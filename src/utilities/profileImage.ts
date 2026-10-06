export function profilePhotoUri(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  let trimmed = url.trim();
  if (!trimmed || /dicebear\.com/i.test(trimmed) || /\.svg(\?|#|$)/i.test(trimmed)) {
    return null;
  }
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`;
  } else if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://');
  }
  if (!/^https:\/\//i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function profileDisplayName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
} | null): string {
  const fullName = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return fullName || user?.userName?.trim() || '';
}

export function profileInitial(userName?: string | null, email?: string | null): string {
  const source = (userName && userName.trim()) || (email && email.trim()) || '';
  if (!source) {
    return '?';
  }
  return source.charAt(0).toUpperCase();
}
