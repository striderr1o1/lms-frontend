import MuxPlayer from '@mux/mux-player-react';
import YouTubePlayer from '../YouTubePlayer.jsx';

export default function VideoStage({ lesson }) {
  if (!lesson) return null;
  if (lesson.playback_id) {
    return (
      <div className="video-stage">
        <MuxPlayer playbackId={lesson.playback_id} />
      </div>
    );
  }
  if (lesson.youtube_video_id) {
    return (
      <div className="video-stage">
        <YouTubePlayer videoId={lesson.youtube_video_id} title={lesson.title} />
      </div>
    );
  }
  return null;
}
