const SOURCES = new Set(['unsplash', 'url', 'upload', 'generated']);

export function withUnsplashUtm(url) {
  const fallback = 'https://unsplash.com/?utm_source=northstar&utm_medium=referral';
  if (!url || typeof url !== 'string') return fallback;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', 'northstar');
    parsed.searchParams.set('utm_medium', 'referral');
    return parsed.toString();
  } catch {
    const join = url.includes('?') ? '&' : '?';
    return `${url}${join}utm_source=northstar&utm_medium=referral`;
  }
}

export function generatedCover(alt = '') {
  return {
    image_url: null,
    source: 'generated',
    alt: alt || null,
    color: null,
    blur_hash: null,
    unsplash_id: null,
    credit_name: null,
    credit_url: null,
  };
}

export function normalizeCover(cover) {
  if (cover == null) return null;
  if (typeof cover !== 'object') return null;
  if (!SOURCES.has(cover.source)) return null;
  const payload = {
    image_url: cover.image_url || null,
    source: cover.source,
    alt: cover.alt || null,
    color: cover.color || null,
    blur_hash: cover.blur_hash || null,
    unsplash_id: cover.unsplash_id || null,
    credit_name: cover.credit_name || null,
    credit_url: cover.credit_url || null,
  };
  if (cover.source === 'unsplash' && cover.download_location) {
    payload.download_location = cover.download_location;
  }
  return payload;
}

export function withOptionalCover(body) {
  if (!body || body.cover === undefined) return body;
  return {
    ...body,
    cover: body.cover == null ? null : normalizeCover(body.cover),
  };
}

export function coverImageSrc(url, size) {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('images.unsplash.com')) return url;
  const width = size === 'hero' ? 1600 : size === 'thumb' ? 320 : 800;
  const height = Math.round((width * 9) / 16);
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('h', String(height));
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('q', '75');
    parsed.searchParams.set('auto', 'format');
    return parsed.toString();
  } catch {
    return url;
  }
}

export function readCover(course) {
  const cover = course?.cover;
  if (!cover || typeof cover !== 'object') return null;
  if (!cover.image_url) return cover.source ? cover : null;
  return cover;
}
