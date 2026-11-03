import { createUpload } from '@mux/upchunk';
import { useEffect, useRef, useState } from 'react';
import {
  createLesson,
  createVideoUpload,
  deleteLesson,
  getVideo,
  updateLesson,
} from '../api/teacher.js';
import YouTubePlayer from './YouTubePlayer.jsx';
import { youtubeWatchUrl } from './youtubeVideo.js';

function uploadErrorMessage(event) {
  const detail = event?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) {
    return detail.message;
  }
  return 'Upload failed';
}

function savedVideoSource(lesson) {
  const source = lesson?.video_source;
  if (source === 'mux' || source === 'youtube') return source;
  if (lesson?.youtube_video_id) return 'youtube';
  if (lesson?.mux_asset_id) return 'mux';
  return null;
}

function isNewYoutube(youtubeInput, savedYoutubeId) {
  const typed = youtubeInput.trim();
  if (!typed) return false;
  const savedUrl = youtubeWatchUrl(savedYoutubeId);
  if (!savedUrl) return true;
  return typed !== savedYoutubeId && typed !== savedUrl;
}

function videoPayload({
  hasLesson,
  removeVideo,
  youtubeInput,
  savedYoutubeId,
  savedSource,
  savedMuxId,
  currentMuxId,
}) {
  const typed = youtubeInput.trim();
  if (isNewYoutube(typed, savedYoutubeId)) {
    return { youtube_url: typed };
  }

  if (currentMuxId && currentMuxId !== savedMuxId) {
    return { mux_asset_id: currentMuxId };
  }

  if (hasLesson && !typed && savedSource === 'youtube') {
    return { youtube_url: null };
  }

  if (removeVideo && hasLesson) {
    if (savedSource === 'youtube') return { youtube_url: null };
    if (savedSource === 'mux') return { mux_asset_id: null };
  }

  return {};
}

export default function LessonEditor({ courseId, lesson, onSaved, onDeleted }) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [body, setBody] = useState(lesson?.body ?? '');
  const [muxAssetId, setMuxAssetId] = useState(lesson?.mux_asset_id ?? null);
  const [savedMuxId, setSavedMuxId] = useState(lesson?.mux_asset_id ?? null);
  const [videoSource, setVideoSource] = useState(lesson?.video_source ?? null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(lesson?.youtube_video_id ?? null);
  const [youtubeUrl, setYoutubeUrl] = useState(() => youtubeWatchUrl(lesson?.youtube_video_id));
  const [videoStatus, setVideoStatus] = useState(lesson?.video_status ?? null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [pollError, setPollError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const assetIdRef = useRef(lesson?.mux_asset_id ?? null);
  const baselineStatusRef = useRef(lesson?.video_status ?? null);
  const uploadRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => () => uploadRef.current?.abort(), []);

  useEffect(() => {
    if (muxAssetId && muxAssetId === savedMuxId) {
      baselineStatusRef.current = videoStatus;
    }
  }, [muxAssetId, savedMuxId, videoStatus]);

  useEffect(() => {
    if (!muxAssetId || removeVideo || videoStatus === 'ready' || videoStatus === 'errored') {
      return undefined;
    }

    let cancelled = false;

    async function poll() {
      try {
        const video = await getVideo(muxAssetId);
        if (cancelled) return;
        setVideoStatus(video.status ?? null);
        setPollError('');
      } catch (err) {
        if (!cancelled) setPollError(err.message || 'Could not check video status');
      }
    }

    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [muxAssetId, removeVideo, videoStatus]);

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setUploadError('Choose a video file.');
      return;
    }

    const previous = uploadRef.current;
    uploadRef.current = null;
    previous?.abort();
    setUploadError('');
    setPollError('');
    setYoutubeUrl('');
    setRemoveVideo(false);
    setUploading(true);
    setUploadProgress(0);

    let endpointError = '';
    let upload;
    try {
      upload = createUpload({
        file,
        chunkSize: 5120,
        endpoint: async () => {
          try {
            const created = await createVideoUpload();
            if (!created?.id || !created?.upload_url) {
              throw new Error('Upload URL was not returned');
            }
            assetIdRef.current = created.id;
            setMuxAssetId(created.id);
            setVideoStatus('waiting');
            return created.upload_url;
          } catch (err) {
            endpointError = err.message || 'Upload failed';
            throw new Error(endpointError);
          }
        },
      });
    } catch (err) {
      setUploading(false);
      setUploadError(err.message || 'Upload failed');
      if (assetIdRef.current === savedMuxId) {
        setYoutubeUrl(youtubeWatchUrl(youtubeVideoId));
      }
      return;
    }

    uploadRef.current = upload;
    upload.on('progress', (progress) => {
      const value = typeof progress?.detail === 'number' ? progress.detail : 0;
      setUploadProgress(value);
    });
    upload.on('success', () => {
      setUploading(false);
      setUploadProgress(100);
    });
    upload.on('error', (event) => {
      if (uploadRef.current !== upload) return;
      setUploading(false);
      setUploadError(endpointError || uploadErrorMessage(event));
      if (assetIdRef.current === savedMuxId) {
        setYoutubeUrl(youtubeWatchUrl(youtubeVideoId));
      }
    });
  }

  function onRemoveVideo() {
    const current = uploadRef.current;
    uploadRef.current = null;
    current?.abort();
    setUploading(false);
    setUploadProgress(null);
    setUploadError('');
    setPollError('');
    setYoutubeUrl('');
    assetIdRef.current = savedMuxId;
    setMuxAssetId(savedMuxId);
    setVideoStatus(savedMuxId ? baselineStatusRef.current : null);
    setRemoveVideo(Boolean(savedMuxId || youtubeVideoId));
  }

  function onKeepVideo() {
    setRemoveVideo(false);
    const url = youtubeWatchUrl(youtubeVideoId);
    if (url) setYoutubeUrl(url);
  }

  function applySaved(saved) {
    const nextAssetId = saved?.mux_asset_id ?? null;
    const nextYoutubeId = saved?.youtube_video_id ?? null;
    const nextStatus = saved?.video_status ?? null;
    assetIdRef.current = nextAssetId;
    setSavedMuxId(nextAssetId);
    setMuxAssetId(nextAssetId);
    setVideoStatus(nextStatus);
    setVideoSource(saved?.video_source ?? null);
    setYoutubeVideoId(nextYoutubeId);
    setYoutubeUrl(youtubeWatchUrl(nextYoutubeId));
    setRemoveVideo(false);
    setUploadProgress(null);
    if (typeof saved?.title === 'string') setTitle(saved.title);
    if (typeof saved?.body === 'string') setBody(saved.body);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busyRef.current || uploading) return;
    busyRef.current = true;
    setBusy(true);
    setError('');

    const trimmedTitle = title.trim();
    setTitle(trimmedTitle);
    const payload = {
      title: trimmedTitle,
      body,
      ...videoPayload({
        hasLesson: Boolean(lesson),
        removeVideo,
        youtubeInput: youtubeUrl,
        savedYoutubeId: youtubeVideoId,
        savedSource: savedVideoSource({
          video_source: videoSource,
          youtube_video_id: youtubeVideoId,
          mux_asset_id: savedMuxId,
        }),
        savedMuxId,
        currentMuxId: assetIdRef.current,
      }),
    };

    try {
      const saved = lesson
        ? await updateLesson(lesson.id, payload)
        : await createLesson(courseId, payload);
      if (lesson) applySaved(saved);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Could not save the lesson');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!lesson || busyRef.current) return;
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await deleteLesson(lesson.id);
      onDeleted(lesson.id);
    } catch (err) {
      setError(err.message || 'Could not delete the lesson');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const pendingMux = Boolean(muxAssetId) && muxAssetId !== savedMuxId;
  const replacingWithUrl = isNewYoutube(youtubeUrl, youtubeVideoId);
  const showMuxStatus = Boolean(muxAssetId) && !removeVideo && !replacingWithUrl;
  const savedWatchUrl = youtubeWatchUrl(youtubeVideoId);
  const showYoutube = Boolean(savedWatchUrl) && !removeVideo && !pendingMux;
  const showRemove = (Boolean(muxAssetId) || Boolean(youtubeVideoId) || Boolean(youtubeUrl.trim()))
    && (!removeVideo || replacingWithUrl);

  return (
    <form className="panel stack lesson-editor" onSubmit={onSubmit}>
      <h3>{lesson ? `Lesson ${lesson.lesson_number}` : 'New lesson'}</h3>
      <label>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          required
        />
      </label>
      <label>
        Lesson notes
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Markdown"
        />
      </label>
      <div className="video-fields">
        <label>
          Video
          <input type="file" accept="video/*" onChange={onFile} disabled={uploading || busy} />
        </label>
        <label>
          YouTube URL
          <input
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            type="text"
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={uploading || busy}
          />
        </label>
      </div>
      {uploading ? (
        <p className="muted">Uploading {Math.round(uploadProgress ?? 0)}%</p>
      ) : null}
      {showMuxStatus ? <p className="muted">Video status: {videoStatus || 'waiting'}</p> : null}
      {showYoutube ? (
        <>
          <p className="muted">{savedWatchUrl}</p>
          <YouTubePlayer videoId={youtubeVideoId} title={title} />
        </>
      ) : null}
      {removeVideo && !replacingWithUrl ? (
        <p className="muted">Video will be removed when you save.</p>
      ) : null}
      {showRemove ? (
        <button type="button" className="secondary" onClick={onRemoveVideo} disabled={busy}>
          Remove video
        </button>
      ) : null}
      {removeVideo && !replacingWithUrl ? (
        <button type="button" className="secondary" onClick={onKeepVideo} disabled={busy}>
          Keep video
        </button>
      ) : null}
      {uploadError ? <p className="form-error" role="alert">{uploadError}</p> : null}
      {pollError ? <p className="form-error" role="alert">{pollError}</p> : null}
      <div className="card-actions">
        <button type="submit" disabled={busy || uploading}>
          {busy ? 'Saving…' : 'Save lesson'}
        </button>
        {lesson ? (
          <button type="button" className="danger" onClick={onDelete} disabled={busy || uploading}>
            Delete
          </button>
        ) : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
