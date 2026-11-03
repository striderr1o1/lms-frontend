const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeWatchUrl(videoId) {
  const id = String(videoId ?? '').trim();
  if (!YOUTUBE_ID.test(id)) return '';
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbedSrc(videoId) {
  const id = String(videoId ?? '').trim();
  if (!YOUTUBE_ID.test(id)) return '';
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
