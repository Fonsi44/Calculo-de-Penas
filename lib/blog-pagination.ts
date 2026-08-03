export type BlogPaginationInput = {
  basePath: string;
  rawPage?: string | string[];
  tag?: string | string[];
  month?: string | string[];
  totalPages?: number;
};

export type BlogPaginationContract = {
  page: number;
  normalizedPath: string;
  canonicalPath: string;
  isFiltered: boolean;
  isPaginated: boolean;
  index: boolean;
  follow: boolean;
  prevPath?: string;
  nextPath?: string;
  redirectTo?: string;
  notFound: boolean;
  tag?: string;
  month?: string;
};

function normalizePage(rawPage?: string | string[]): {
  page: number;
  invalid: boolean;
  changed: boolean;
} {
  if (Array.isArray(rawPage)) return { page: 1, invalid: true, changed: false };
  if (rawPage === undefined) return { page: 1, invalid: false, changed: false };

  const trimmed = rawPage.trim();
  if (trimmed === '') return { page: 1, invalid: false, changed: true };
  if (!/^\+?\d+$/.test(trimmed)) return { page: 1, invalid: true, changed: false };

  const page = Number(trimmed.replace(/^\+/, ''));
  if (!Number.isSafeInteger(page) || page < 1) {
    return { page: 1, invalid: true, changed: false };
  }

  return {
    page,
    invalid: false,
    changed: page === 1 || rawPage !== String(page),
  };
}

function normalizeMonth(rawMonth?: string | string[]): {
  month?: string;
  invalid: boolean;
  changed: boolean;
} {
  if (Array.isArray(rawMonth)) return { invalid: true, changed: false };
  if (rawMonth === undefined) return { invalid: false, changed: false };

  const trimmed = rawMonth.trim();
  if (trimmed === '') return { invalid: false, changed: true };

  const match = /^(\d{4})-(\d{1,2})$/.exec(trimmed);
  if (!match) return { invalid: true, changed: false };
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    return { invalid: true, changed: false };
  }

  const month = `${match[1]}-${String(monthNumber).padStart(2, '0')}`;
  return { month, invalid: false, changed: rawMonth !== month };
}

function normalizeTag(rawTag?: string | string[]): {
  tag?: string;
  invalid: boolean;
  changed: boolean;
} {
  if (Array.isArray(rawTag)) return { invalid: true, changed: false };
  if (rawTag === undefined) return { invalid: false, changed: false };
  const tag = rawTag.trim();
  return {
    tag: tag || undefined,
    invalid: false,
    changed: rawTag !== tag || tag === '',
  };
}

/** Construye siempre los parámetros en el orden canónico: page, tag, month. */
export function buildBlogPaginationPath(
  basePath: string,
  page: number,
  tag?: string,
  month?: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (tag) params.set('tag', tag);
  if (month) params.set('month', month);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function resolveBlogPagination(input: BlogPaginationInput): BlogPaginationContract {
  const pageResult = normalizePage(input.rawPage);
  const tagResult = normalizeTag(input.tag);
  const monthResult = normalizeMonth(input.month);
  const invalid = pageResult.invalid || tagResult.invalid || monthResult.invalid;
  const page = pageResult.page;
  const tag = tagResult.tag;
  const month = monthResult.month;
  const isFiltered = Boolean(tag || month);
  const normalizedPath = buildBlogPaginationPath(input.basePath, page, tag, month);
  const outOfRange = input.totalPages !== undefined && page > input.totalPages;
  const notFound = invalid || outOfRange;
  const needsRedirect = !notFound && (
    pageResult.changed || tagResult.changed || monthResult.changed
  );

  return {
    page,
    normalizedPath,
    canonicalPath: normalizedPath,
    isFiltered,
    isPaginated: page > 1,
    index: !isFiltered,
    follow: true,
    prevPath: !notFound && page > 1
      ? buildBlogPaginationPath(input.basePath, page - 1, tag, month)
      : undefined,
    nextPath: !notFound && input.totalPages !== undefined && page < input.totalPages
      ? buildBlogPaginationPath(input.basePath, page + 1, tag, month)
      : undefined,
    redirectTo: needsRedirect ? normalizedPath : undefined,
    notFound,
    tag,
    month,
  };
}
