import { youtubeEmbedSrc } from './youtubeVideo.js';

export default function YouTubePlayer({ videoId, title }) {
  const src = youtubeEmbedSrc(videoId);
  if (!src) return null;
  const heading = typeof title === 'string' ? title.trim() : '';
  return (
    <iframe
      className="lesson-video"
      src={src}
      title={heading ? `${heading} video` : 'Lesson video'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
