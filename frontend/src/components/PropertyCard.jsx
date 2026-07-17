const numberFormatter = new Intl.NumberFormat('en-US');
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'Price unavailable';
  }

  return priceFormatter.format(Number(value));
}

function formatNumber(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return numberFormatter.format(Number(value));
}

function parseFirstPhoto(photosValue) {
  if (!photosValue) {
    return null;
  }

  if (Array.isArray(photosValue)) {
    return typeof photosValue[0] === 'string' && photosValue[0] ? photosValue[0] : null;
  }

  if (typeof photosValue !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(photosValue);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return typeof parsed[0] === 'string' && parsed[0] ? parsed[0] : null;
  } catch {
    return null;
  }
}

function handleImageError(event) {
  event.currentTarget.hidden = true;
  event.currentTarget.parentElement?.classList.add('is-empty');
}

export default function PropertyCard({ property }) {
  const photoUrl = parseFirstPhoto(property.L_Photos);
  const cityState = [property.L_City, property.L_State].filter(Boolean).join(', ');
  const address = property.L_Address || 'Address unavailable';
  const beds = formatNumber(property.L_Keyword2);
  const baths = formatNumber(property.LM_Dec_3);
  const sqft = formatNumber(property.LM_Int2_3);

  return (
    <article className="property-card">
      <div className={`property-photo ${photoUrl ? '' : 'is-empty'}`}>
        {photoUrl ? (
          <img src={photoUrl} alt={address} loading="lazy" onError={handleImageError} />
        ) : null}
        <span className="photo-fallback">No photo</span>
      </div>

      <div className="property-body">
        <div>
          <p className="property-price">{formatPrice(property.L_SystemPrice)}</p>
          <h2>{address}</h2>
          <p className="property-location">{cityState || 'Location unavailable'}</p>
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
