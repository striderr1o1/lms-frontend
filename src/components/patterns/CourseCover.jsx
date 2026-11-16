import { useEffect, useState } from 'react';
import { coverImageSrc, readCover } from '../../api/covers.js';
import { courseInitial, coverGradientIndex } from '../../utils/courseVisuals.js';

export default function CourseCover({ course, size = 'card', priority = false, className = '' }) {
  const cover = readCover(course);
  const imageUrl = cover?.image_url || '';
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);
  const showImage = Boolean(imageUrl) && !failed;
  const seed = course?.id || course?.name || 'northstar';
  const gradient = coverGradientIndex(seed);
  const initial = courseInitial(course?.name);
  const alt = cover?.alt || course?.name || '';

  return (
    <div
      className={[
        'course-cover',
        `course-cover-${size}`,
        showImage ? '' : `course-cover-generated cover-grad-${gradient}`,
        className,
      ].filter(Boolean).join(' ')}
      style={showImage && cover?.color ? { background: cover.color } : undefined}
    >
      {showImage ? (
        <img
          className="course-cover-img"
          src={coverImageSrc(imageUrl, size)}
          alt={size === 'hero' ? '' : alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          onLoad={(event) => event.currentTarget.classList.add('is-shown')}
        />
      ) : (
        <>
          <span className="course-cover-initial" aria-hidden="true">{initial}</span>
          {size !== 'hero' ? <span className="sr-only">{alt || 'Generated course cover'}</span> : null}
        </>
      )}
    </div>
  );
}
