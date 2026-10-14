import i18next from 'i18next';

export function isBanglaContent(): boolean {
  const code = (i18next.resolvedLanguage || i18next.language || 'en').toLowerCase().split('-')[0];
  return code === 'bn';
}

export function withCatalogLang<T extends Record<string, string | number | boolean | undefined>>(
  params?: T,
): T & { lang?: 'bn' } {
  const base = { ...(params ?? {}) } as T;
  if (!isBanglaContent()) {
    return base;
  }
  return { ...base, lang: 'bn' };
}
