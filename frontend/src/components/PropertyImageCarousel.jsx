import { useState } from 'react';

export default function PropertyImageCarousel({ alt, photos }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const hasPhotos = photos.length > 0;
  const safeIndex = hasPhotos ? Math.min(currentIndex, photos.length - 1) : 0;
  const currentPhoto = hasPhotos ? photos[safeIndex] : '';
  const isCurrentPhotoBroken = failedImages.has(currentPhoto);

  function blockCardNavigation(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function showPrevious(event) {
    blockCardNavigation(event);
    setCurrentIndex((index) => (index === 0 ? photos.length - 1 : index - 1));
  }

  function showNext(event) {
    blockCardNavigation(event);
    setCurrentIndex((index) => (index + 1) % photos.length);
  }

  function handleImageError(photoUrl) {
    setFailedImages((current) => new Set(current).add(photoUrl));
  }

  return (
    <div className={`property-photo ${hasPhotos && !isCurrentPhotoBroken ? '' : 'is-empty'}`}>
      {hasPhotos && !isCurrentPhotoBroken ? (
        <img
          src={currentPhoto}
          alt={alt}
          loading="lazy"
          onError={() => handleImageError(currentPhoto)}
        />
      ) : null}

      <span className="photo-fallback">
        {hasPhotos && isCurrentPhotoBroken ? 'Photo unavailable' : 'No photo'}
      </span>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="carousel-button carousel-button-prev"
            aria-label="Previous photo"
            onClick={showPrevious}
          >
            &lt;
          </button>
          <button
            type="button"
            className="carousel-button carousel-button-next"
            aria-label="Next photo"
            onClick={showNext}
          >
            &gt;
          </button>
        </>
      ) : null}

      {hasPhotos ? (
        <span className="photo-counter">
          {safeIndex + 1} / {photos.length}
        </span>
      ) : null}
    </div>
  );
}
