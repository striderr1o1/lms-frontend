import { createUpload } from '@mux/upchunk';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createLesson,
  createVideoUpload,
  deleteLesson,
  getVideo,
  updateLesson,
} from '../api/teacher.js';
import MarkdownReader from './patterns/MarkdownReader.jsx';
import VideoStage from './patterns/VideoStage.jsx';
import { youtubeWatchUrl } from './youtubeVideo.js';
import Button from './primitives/Button.jsx';
import SegmentedControl from './primitives/SegmentedControl.jsx';

const MAX_BLOCKS = 40;

const VIDEO_MODES = [
  { value: 'youtube', label: 'YouTube URL' },
  { value: 'upload', label: 'Upload Video' },
];

const NOTE_MODES = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
];

let clientSeq = 0;

function newClientId() {
  clientSeq += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `block-${clientSeq}`;
}

function uploadErrorMessage(event) {
  const detail = event?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail.message === 'string' && detail.message.trim()) {
    return detail.message;
  }
  return 'Upload failed';
}

function emptyTextBlock() {
  return {
    clientId: newClientId(),
    kind: 'text',
    body: '',
    notesMode: 'write',
  };
}

function emptyVideoBlock() {
  return {
    clientId: newClientId(),
    kind: 'video',
    mode: 'youtube',
    youtubeUrl: '',
    youtubeVideoId: null,
    muxAssetId: null,
    videoStatus: null,
    uploading: false,
    uploadProgress: null,
    uploadError: '',
    pollError: '',
  };
}

function videoMode(block) {
  if (block?.video_source === 'mux') return 'upload';
  if (block?.video_source === 'youtube') return 'youtube';
  if (block?.mux_asset_id && !block?.youtube_video_id) return 'upload';
  if (block?.youtube_video_id) return 'youtube';
  if (block?.mux_asset_id) return 'upload';
  return 'youtube';
}

function hydrateBlock(block) {
  const clientId = block?.id != null && String(block.id).trim()
    ? String(block.id)
    : newClientId();
  if (block?.kind === 'video') {
    return {
      clientId,
      kind: 'video',
      mode: videoMode(block),
      youtubeUrl: youtubeWatchUrl(block.youtube_video_id),
      youtubeVideoId: block.youtube_video_id ?? null,
      muxAssetId: block.mux_asset_id ?? null,
      videoStatus: block.video_status ?? null,
      uploading: false,
      uploadProgress: null,
      uploadError: '',
      pollError: '',
    };
  }
  return {
    clientId,
    kind: 'text',
    body: typeof block?.body === 'string' ? block.body : '',
    notesMode: 'write',
  };
}

function hydrateBlocks(blocks) {
  const list = Array.isArray(blocks) ? blocks : [];
  const sorted = list
    .map((block, index) => ({ block, index }))
    .sort((left, right) => {
      const lp = Number(left.block?.position);
      const rp = Number(right.block?.position);
      if (Number.isFinite(lp) && Number.isFinite(rp) && lp !== rp) return lp - rp;
      return left.index - right.index;
    })
    .map(({ block }) => hydrateBlock(block));
  if (sorted.length === 0) return [emptyTextBlock()];
  return sorted;
}

function buildBlocksPayload(blocks) {
  if (blocks.length < 1 || blocks.length > MAX_BLOCKS) {
    return { error: 'A lesson needs between 1 and 40 blocks.' };
  }
  const payload = [];
  for (const block of blocks) {
    if (block.kind === 'text') {
      payload.push({ kind: 'text', body: block.body ?? '' });
      continue;
    }
    if (block.mode === 'upload') {
      if (!block.muxAssetId) {
        return { error: 'Each video block needs a YouTube URL or a finished upload.' };
      }
      payload.push({ kind: 'video', mux_asset_id: block.muxAssetId });
      continue;
    }
    const youtubeUrl = String(block.youtubeUrl ?? '').trim();
    if (!youtubeUrl) {
      return { error: 'Each video block needs a YouTube URL or a finished upload.' };
    }
    payload.push({ kind: 'video', youtube_url: youtubeUrl });
  }
  const hasText = payload.some((block) => block.kind === 'text' && block.body.trim());
  const hasVideo = payload.some((block) => block.kind === 'video');
  if (!hasText && !hasVideo) {
    return { error: 'Add lesson notes or a video before saving.' };
  }
  return { blocks: payload };
}

function TextBlockEditor({ block, disabled, onPatch }) {
  return (
    <div className="field">
      <span className="field-label-row">
        <span className="field-label">Notes</span>
        <SegmentedControl
          className="segmented-fit"
          label="Notes mode"
          value={block.notesMode}
          onChange={(notesMode) => onPatch(block.clientId, { notesMode })}
          options={NOTE_MODES}
          disabled={disabled}
        />
      </span>
      {block.notesMode === 'preview' ? (
        block.body.trim()
          ? <MarkdownReader markdown={block.body} />
          : <p className="muted">Nothing to preview.</p>
      ) : (
        <textarea
          value={block.body}
          onChange={(event) => onPatch(block.clientId, { body: event.target.value })}
          placeholder="Markdown"
          disabled={disabled}
        />
      )}
    </div>
  );
}

function VideoBlockEditor({ block, title, disabled, onPatch }) {
  const uploadRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => () => {
    requestRef.current += 1;
    const current = uploadRef.current;
    uploadRef.current = null;
    current?.abort();
  }, []);

  useEffect(() => {
    if (block.mode !== 'upload' || !block.muxAssetId) return undefined;
    if (block.videoStatus === 'ready' || block.videoStatus === 'errored') return undefined;

    let cancelled = false;
    const assetId = block.muxAssetId;

    async function poll() {
      try {
        const video = await getVideo(assetId);
        if (cancelled) return;
        onPatch(block.clientId, {
          videoStatus: video.status ?? null,
          pollError: '',
        });
      } catch (err) {
        if (!cancelled) {
          onPatch(block.clientId, { pollError: err.message || 'Could not check video status' });
        }
      }
    }

    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [block.clientId, block.mode, block.muxAssetId, block.videoStatus, onPatch]);

  function selectMode(next) {
    if (next === block.mode) return;
    if (next === 'youtube') {
      requestRef.current += 1;
      const current = uploadRef.current;
      uploadRef.current = null;
      current?.abort();
      const savedUrl = youtubeWatchUrl(block.youtubeVideoId);
      onPatch(block.clientId, {
        mode: 'youtube',
        uploading: false,
        uploadProgress: null,
        uploadError: '',
        youtubeUrl: block.youtubeUrl || savedUrl,
      });
      return;
    }
    onPatch(block.clientId, { mode: 'upload' });
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      onPatch(block.clientId, { uploadError: 'Choose a video file.' });
      return;
    }

    const request = requestRef.current + 1;
    requestRef.current = request;
    const previous = uploadRef.current;
    uploadRef.current = null;
    previous?.abort();
    onPatch(block.clientId, {
      mode: 'upload',
      uploading: true,
      uploadProgress: 0,
      uploadError: '',
      pollError: '',
    });

    let endpointError = '';
    let upload;
    try {
      upload = createUpload({
        file,
        chunkSize: 5120,
        endpoint: async () => {
          try {
            const created = await createVideoUpload();
            if (requestRef.current !== request) {
              throw new Error('Upload cancelled');
            }
            if (!created?.id || !created?.upload_url) {
              throw new Error('Upload URL was not returned');
            }
            onPatch(block.clientId, {
              muxAssetId: created.id,
              videoStatus: 'waiting',
            });
            return created.upload_url;
          } catch (err) {
            endpointError = err.message || 'Upload failed';
            throw new Error(endpointError);
          }
        },
      });
    } catch (err) {
      if (requestRef.current !== request) return;
      onPatch(block.clientId, {
        uploading: false,
        uploadError: err.message || 'Upload failed',
      });
      return;
    }

    uploadRef.current = upload;
    upload.on('progress', (progress) => {
      if (requestRef.current !== request) return;
      const value = typeof progress?.detail === 'number' ? progress.detail : 0;
      onPatch(block.clientId, { uploadProgress: value });
    });
    upload.on('success', () => {
      if (requestRef.current !== request) return;
      onPatch(block.clientId, { uploading: false, uploadProgress: 100 });
    });
    upload.on('error', (uploadEvent) => {
      if (requestRef.current !== request || uploadRef.current !== upload) return;
      onPatch(block.clientId, {
        uploading: false,
        uploadError: endpointError || uploadErrorMessage(uploadEvent),
      });
    });
  }

  const savedWatchUrl = youtubeWatchUrl(block.youtubeVideoId);
  const typedUrl = String(block.youtubeUrl ?? '').trim();
  const showSavedYoutube = block.mode === 'youtube'
    && Boolean(savedWatchUrl)
    && (typedUrl === savedWatchUrl || typedUrl === block.youtubeVideoId);
  const showMuxStatus = block.mode === 'upload' && Boolean(block.muxAssetId);

  return (
    <>
      <div className="field">
        <span className="field-label">Video</span>
        <SegmentedControl
          label="Video source"
          value={block.mode}
          onChange={selectMode}
          options={VIDEO_MODES}
          disabled={disabled}
        />
      </div>
      {block.mode === 'upload' ? (
        <label className="field">
          Video file
          <input
            type="file"
            accept="video/*"
            onChange={onFile}
            disabled={disabled || block.uploading}
          />
        </label>
      ) : (
        <label className="field">
          YouTube URL
          <input
            value={block.youtubeUrl}
            onChange={(event) => onPatch(block.clientId, { youtubeUrl: event.target.value })}
            type="text"
            placeholder="https://www.youtube.com/watch?v=…"
            disabled={disabled || block.uploading}
          />
        </label>
      )}
      {block.uploading ? (
        <div className="upload-progress">
          <progress max="100" value={Math.round(block.uploadProgress ?? 0)} />
          <p className="muted">Uploading {Math.round(block.uploadProgress ?? 0)}%</p>
        </div>
      ) : null}
      {showMuxStatus ? <p className="muted">Video status: {block.videoStatus || 'waiting'}</p> : null}
      {showSavedYoutube ? (
        <>
          <p className="muted">{savedWatchUrl}</p>
          <VideoStage lesson={{ title, youtube_video_id: block.youtubeVideoId }} />
        </>
      ) : null}
      {block.uploadError ? <p className="form-error" role="alert">{block.uploadError}</p> : null}
      {block.pollError ? <p className="form-error" role="alert">{block.pollError}</p> : null}
    </>
  );
}

export default function LessonEditor({ courseId, lesson, onSaved, onDeleted }) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [blocks, setBlocks] = useState(() => hydrateBlocks(lesson?.blocks));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const patchBlock = useCallback((clientId, patch) => {
    setBlocks((current) => current.map((block) => (
      block.clientId === clientId ? { ...block, ...patch } : block
    )));
  }, []);

  function moveBlock(clientId, delta) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.clientId === clientId);
      const next = index + delta;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function removeBlock(clientId) {
    setBlocks((current) => {
      if (current.length <= 1) return current;
      return current.filter((block) => block.clientId !== clientId);
    });
  }

  function addBlock(kind) {
    setBlocks((current) => {
      if (current.length >= MAX_BLOCKS) return current;
      return [...current, kind === 'video' ? emptyVideoBlock() : emptyTextBlock()];
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const uploading = blocks.some((block) => block.uploading);
    if (busyRef.current || uploading) return;

    const trimmedTitle = title.trim();
    const built = buildBlocksPayload(blocks);
    setTitle(trimmedTitle);
    if (built.error) {
      setError(built.error);
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError('');
    const payload = { title: trimmedTitle, blocks: built.blocks };

    try {
      const saved = lesson
        ? await updateLesson(lesson.id, payload)
        : await createLesson(courseId, payload);
      if (lesson) {
        if (typeof saved?.title === 'string') setTitle(saved.title);
        if (Array.isArray(saved?.blocks)) setBlocks(hydrateBlocks(saved.blocks));
      }
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

  const uploading = blocks.some((block) => block.uploading);
  const atBlockLimit = blocks.length >= MAX_BLOCKS;

  return (
    <form className="editor-panel stack" onSubmit={onSubmit}>
      <h3 className="card-title">{lesson ? `Lesson ${lesson.lesson_number}` : 'New lesson'}</h3>
      <label className="field">
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          required
        />
      </label>
      <div className="stack">
        {blocks.map((block, index) => {
          const kindLabel = block.kind === 'video' ? 'Video' : 'Text';
          return (
            <section
              className="lesson-block"
              key={block.clientId}
              aria-label={`${kindLabel} block ${index + 1}`}
            >
              <div className="lesson-block-bar">
                <span className="field-label">{kindLabel}</span>
                <Button
                  variant="secondary"
                  disabled={busy || index === 0}
                  onClick={() => moveBlock(block.clientId, -1)}
                >
                  Move up
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || index === blocks.length - 1}
                  onClick={() => moveBlock(block.clientId, 1)}
                >
                  Move down
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || blocks.length <= 1}
                  onClick={() => removeBlock(block.clientId)}
                >
                  Remove
                </Button>
              </div>
              {block.kind === 'video' ? (
                <VideoBlockEditor
                  block={block}
                  title={title}
                  disabled={busy}
                  onPatch={patchBlock}
                />
              ) : (
                <TextBlockEditor block={block} disabled={busy} onPatch={patchBlock} />
              )}
            </section>
          );
        })}
      </div>
      <div className="lesson-block-bar">
        <Button variant="secondary" disabled={busy || atBlockLimit} onClick={() => addBlock('text')}>
          Add text
        </Button>
        <Button variant="secondary" disabled={busy || atBlockLimit} onClick={() => addBlock('video')}>
          Add video
        </Button>
      </div>
      {atBlockLimit ? <p className="muted">A lesson can have up to 40 blocks.</p> : null}
      <div className="card-actions">
        <Button type="submit" disabled={busy || uploading}>
          {busy ? 'Saving…' : 'Save lesson'}
        </Button>
        {lesson ? (
          <Button variant="danger" confirm disabled={busy || uploading} onConfirm={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
