import PropertyImageCarousel from './PropertyImageCarousel';
import { formatListedDate, formatNumber, formatPrice } from '../utils/formatters';
import { parsePhotoUrls } from '../utils/photos';

export default function PropertyCard({ isFavorite = false, onOpen, onToggleFavorite, property }) {
  const photoUrls = parsePhotoUrls(property.L_Photos);
  const cityState = [property.L_City, property.L_State].filter(Boolean).join(', ');
  const address = property.L_Address || 'Address unavailable';
  const beds = formatNumber(property.L_Keyword2);
  const baths = formatNumber(property.LM_Dec_3);
  const sqft = formatNumber(property.LM_Int2_3);
  const listedDate = formatListedDate(property.ListingContractDate);

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.();
    }
  }

  return (
    <article
      className="property-card"
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`favorite-button ${isFavorite ? 'is-active' : ''}`}
        aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        aria-pressed={isFavorite}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite?.(property);
        }}
      >
        <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
      </button>

      <PropertyImageCarousel alt={address} photos={photoUrls} />

      <div className="property-body">
        <div>
          <p className="property-price">{formatPrice(property.L_SystemPrice)}</p>
          <h2>{address}</h2>
          <p className="property-location">{cityState || 'Location unavailable'}</p>
          <p className="property-listed-date">{listedDate}</p>
        </div>

        <dl className="property-facts" aria-label="Property facts">
          <div>
            <dt>Beds</dt>
            <dd>{beds}</dd>
          </div>
          <div>
            <dt>Baths</dt>
            <dd>{baths}</dd>
          </div>
          <div>
            <dt>Sqft</dt>
            <dd>{sqft}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
