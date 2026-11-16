import { useEffect, useState } from 'react';
import { searchUnsplash } from '../../api/admin.js';
import { generatedCover } from '../../api/covers.js';
import { coverGradientIndex, courseInitial } from '../../utils/courseVisuals.js';
import CourseCover from './CourseCover.jsx';
import Tabs from '../primitives/Tabs.jsx';

function validateImageUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter an image URL.';
  if (trimmed.length > 2048) return 'URL must be 2048 characters or fewer.';
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Enter a valid https URL.';
  }
  if (parsed.protocol !== 'https:') return 'Only https URLs are allowed.';
  if (parsed.username || parsed.password) return 'URLs with a username or password are not allowed.';
  return '';
}

function unsplashToCover(photo) {
  return {
    source: 'unsplash',
    unsplash_id: photo.id,
    image_url: photo.urls?.regular || photo.urls?.small || photo.urls?.thumb || null,
    alt: photo.alt || '',
    color: photo.color || null,
    blur_hash: photo.blur_hash || null,
    credit_name: photo.user?.name || '',
    credit_url: photo.user?.profile_url || '',
    download_location: photo.download_location || null,
  };
}

export default function CoverPicker({ courseId, courseName, value, onChange }) {
  const [unsplashAvailable, setUnsplashAvailable] = useState(true);
  const [tab, setTab] = useState('unsplash');
  const [query, setQuery] = useState(courseName || '');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value?.source === 'url' ? (value.image_url || '') : '');
  const [urlError, setUrlError] = useState('');
  const previewCourse = {
    id: courseId || courseName || 'preview',
    name: courseName || 'Course',
    cover: value?.source === 'generated' ? null : value,
  };
  const gradient = coverGradientIndex(courseId || courseName || 'preview');

  useEffect(() => {
    if (!unsplashAvailable || tab !== 'unsplash') return undefined;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchError('');
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError('');
      searchUnsplash(trimmed, page)
        .then((data) => {
          if (cancelled) return;
          const next = Array.isArray(data?.results) ? data.results : [];
          setResults((current) => (page === 1 ? next : [...current, ...next]));
          setTotalPages(Number(data?.total_pages) || 1);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err?.status === 503) {
            setUnsplashAvailable(false);
            setTab((current) => (current === 'unsplash' ? 'url' : current));
            return;
          }
          setSearchError(err.message || 'Image search is unavailable');
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, page, tab, unsplashAvailable]);

  function applyUrl() {
    const message = validateImageUrl(urlDraft);
    setUrlError(message);
    if (message) return;
    onChange({
      source: 'url',
      image_url: urlDraft.trim(),
      alt: courseName || 'Course cover',
      color: null,
      blur_hash: null,
      unsplash_id: null,
      credit_name: null,
      credit_url: null,
    });
  }

  const tabs = [
    unsplashAvailable ? {
      value: 'unsplash',
      label: 'Unsplash',
      content: (
        <div className="stack">
          <label className="field">
            <span className="field-label">Search photos</span>
            <input
              value={query}
              placeholder="Landscapes, books, classrooms"
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
            />
          </label>
          {searchError ? <p className="form-error" role="alert">{searchError}</p> : null}
          <div className="unsplash-grid">
            {results.map((photo) => {
              const selected = value?.unsplash_id && value.unsplash_id === photo.id;
              return (
                <button
                  key={photo.id}
                  type="button"
                  className={selected ? 'unsplash-thumb is-selected' : 'unsplash-thumb'}
                  onClick={() => onChange(unsplashToCover(photo))}
                >
                  <img src={photo.urls?.thumb || photo.urls?.small} alt={photo.alt || ''} />
                  {photo.user?.name ? <span className="unsplash-credit">{photo.user.name}</span> : null}
                </button>
              );
            })}
          </div>
          {searching ? <p className="muted">Searching…</p> : null}
          {!searching && query.trim() && !results.length && !searchError ? (
            <p className="muted">No photos matched that search.</p>
          ) : null}
          {page < totalPages && results.length ? (
            <button type="button" className="button button-secondary" onClick={() => setPage((current) => current + 1)}>
              Load more
            </button>
          ) : null}
        </div>
      ),
    } : null,
    {
      value: 'url',
      label: 'Paste URL',
      content: (
        <div className="stack">
          <label className="field">
            <span className="field-label">Image URL</span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                setUrlError('');
              }}
            />
          </label>
          <p className="field-hint">Images hosted on other sites may break if the owner removes them. https only.</p>
          {urlError ? <p className="form-error" role="alert">{urlError}</p> : null}
          <button type="button" className="button button-secondary" onClick={applyUrl}>Use this URL</button>
        </div>
      ),
    },
    {
      value: 'generated',
      label: 'Auto-generated',
      content: (
        <div className="stack">
          <p className="muted">This cover is generated from the course, so it stays the same without a photo.</p>
          <div className="gradient-options" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className={index === gradient ? `gradient-swatch cover-grad-${index} is-selected` : `gradient-swatch cover-grad-${index}`}
              >
                <span>{courseInitial(courseName)}</span>
              </span>
            ))}
          </div>
          <button type="button" className="button button-secondary" onClick={() => onChange(generatedCover(courseName))}>
            Use the generated cover
          </button>
        </div>
      ),
    },
  ].filter(Boolean);

  const activeTab = tabs.some((item) => item.value === tab) ? tab : tabs[0].value;

  return (
    <div className="cover-picker stack">
      <div className="cover-preview">
        <CourseCover course={previewCourse} size="card" />
      </div>
      <Tabs label="Cover source" tabs={tabs} value={activeTab} onChange={setTab} />
      <button
        type="button"
        className="button button-ghost"
        onClick={() => onChange(generatedCover(courseName))}
      >
        Remove cover
      </button>
    </div>
  );
}
