import MuxPlayer from '@mux/mux-player-react';
import MarkdownBody from './MarkdownBody.jsx';
import YouTubePlayer from './YouTubePlayer.jsx';

export default function LessonView({ lesson }) {
  return (
    <article className="lesson">
      <h2>
        {lesson.lesson_number}. {lesson.title}
      </h2>
      <MarkdownBody markdown={lesson.body} />
      {lesson.playback_id ? (
        <MuxPlayer playbackId={lesson.playback_id} />
      ) : (
        <YouTubePlayer videoId={lesson.youtube_video_id} title={lesson.title} />
      )}
    </article>
  );
}
