import PropertyImageCarousel from './PropertyImageCarousel';
import { formatNumber, formatPrice } from '../utils/formatters';
import { parsePhotoUrls } from '../utils/photos';

export default function PropertyCard({ property }) {
  const photoUrls = parsePhotoUrls(property.L_Photos);
  const cityState = [property.L_City, property.L_State].filter(Boolean).join(', ');
  const address = property.L_Address || 'Address unavailable';
  const beds = formatNumber(property.L_Keyword2);
  const baths = formatNumber(property.LM_Dec_3);
  const sqft = formatNumber(property.LM_Int2_3);

  return (
    <article className="property-card">
      <PropertyImageCarousel alt={address} photos={photoUrls} />

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
