import { useEffect, useRef, useState } from 'react';

export default function PropertyImageGallery({ alt, photos }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const lightboxRef = useRef(null);
  const hasPhotos = photos.length > 0;
  const safeIndex = hasPhotos ? Math.min(currentIndex, photos.length - 1) : 0;
  const currentPhoto = hasPhotos ? photos[safeIndex] : '';
  const isCurrentPhotoBroken = failedImages.has(currentPhoto);

  useEffect(() => {
    if (isLightboxOpen) {
      lightboxRef.current?.focus();
    }
  }, [isLightboxOpen]);

  function showPrevious() {
    setCurrentIndex((index) => (index === 0 ? photos.length - 1 : index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => (index + 1) % photos.length);
  }

  function handleImageError(photoUrl) {
    setFailedImages((current) => new Set(current).add(photoUrl));
  }

  function handleLightboxKeyDown(event) {
    if (event.key === 'Escape') {
      setIsLightboxOpen(false);
    }

    if (event.key === 'ArrowLeft' && photos.length > 1) {
      showPrevious();
    }

    if (event.key === 'ArrowRight' && photos.length > 1) {
      showNext();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      setIsLightboxOpen(false);
    }
  }

  if (!hasPhotos) {
    return (
      <section className="detail-gallery is-empty" aria-label="Property photos">
        <div className="gallery-empty">No photos available</div>
      </section>
    );
  }

  return (
    <section className="detail-gallery" aria-label="Property photos">
      <button
        type="button"
        className="gallery-main"
        aria-label="Open photo lightbox"
        onClick={() => setIsLightboxOpen(true)}
      >
        {isCurrentPhotoBroken ? (
          <span className="gallery-main-fallback">Photo unavailable</span>
        ) : (
          <img src={currentPhoto} alt={alt} onError={() => handleImageError(currentPhoto)} />
        )}
      </button>

      <div className="gallery-thumbnails" aria-label="Property photo thumbnails">
        {photos.map((photoUrl, index) => {
          const isPhotoBroken = failedImages.has(photoUrl);

          return (
          <button
            type="button"
            className={`gallery-thumbnail ${index === safeIndex ? 'is-active' : ''} ${
              isPhotoBroken ? 'is-broken' : ''
            }`}
            key={`${photoUrl}-${index}`}
            aria-label={`Show photo ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
          >
            {isPhotoBroken ? (
              <span>Unavailable</span>
            ) : (
              <img src={photoUrl} alt="" onError={() => handleImageError(photoUrl)} />
            )}
          </button>
          );
        })}
      </div>

      {isLightboxOpen ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Property photo lightbox"
          tabIndex={-1}
          ref={lightboxRef}
          onClick={handleOverlayClick}
          onKeyDown={handleLightboxKeyDown}
        >
          <button
            type="button"
            className="lightbox-close"
            aria-label="Close lightbox"
            onClick={() => setIsLightboxOpen(false)}
          >
            x
          </button>

          {photos.length > 1 ? (
            <button
              type="button"
              className="lightbox-arrow lightbox-arrow-prev"
              aria-label="Previous photo"
              onClick={showPrevious}
            >
              &lt;
            </button>
          ) : null}

          {isCurrentPhotoBroken ? (
            <div className="lightbox-fallback">Photo unavailable</div>
          ) : (
            <img src={currentPhoto} alt={alt} onError={() => handleImageError(currentPhoto)} />
          )}

          {photos.length > 1 ? (
            <button
              type="button"
              className="lightbox-arrow lightbox-arrow-next"
              aria-label="Next photo"
              onClick={showNext}
            >
              &gt;
            </button>
          ) : null}

          <span className="lightbox-counter">
            {safeIndex + 1} / {photos.length}
          </span>
        </div>
      ) : null}
    </section>
  );
}
