import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPropertyDetail, fetchPropertyOpenHouses } from '../api/client';
import PropertyImageGallery from '../components/PropertyImageGallery';
import PropertyMap from '../components/PropertyMap';
import { formatNumber, formatPrice } from '../utils/formatters';
import { formatOpenHouseDate, formatOpenHouseTimeRange, getOpenHouseRemarks } from '../utils/openHouses';
import { parsePhotoUrls } from '../utils/photos';

function getFirstValue(property, keys) {
  return keys.map((key) => property[key]).find((value) => value !== null && value !== undefined && value !== '');
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || 'N/A'}</dd>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);
      setError('');

      try {
        const [propertyData, openHouseData] = await Promise.all([
          fetchPropertyDetail(id),
          fetchPropertyOpenHouses(id),
        ]);

        if (!isActive) {
          return;
        }

        setProperty(propertyData);
        setOpenHouses(Array.isArray(openHouseData) ? openHouseData : []);
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(requestError.message);
        setProperty(null);
        setOpenHouses([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="detail-page">
        <Link className="back-link" to="/">
          Back to listings
        </Link>
        <section className="state-panel" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading property details...</p>
        </section>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="detail-page">
        <Link className="back-link" to="/">
          Back to listings
        </Link>
        <section className="state-panel error-panel" role="alert">
          <p>{error || 'Property not found'}</p>
        </section>
      </main>
    );
  }

  const address = property.L_Address || 'Address unavailable';
  const cityStateZip = [property.L_City, property.L_State, property.L_Zip].filter(Boolean).join(', ');
  const photoUrls = parsePhotoUrls(property.L_Photos);
  const yearBuilt = getFirstValue(property, ['YearBuilt', 'LM_Int4_2', 'L_YearBuilt']);
  const propertyType = getFirstValue(property, ['L_Type_', 'PropertyType', 'L_Class']);
  const status = getFirstValue(property, ['L_Status', 'MlsStatus', 'Status']);
  const lotSize = getFirstValue(property, ['LotSizeSquareFeet', 'LM_Int1_4', 'LM_Int4_3']);

  return (
    <main className="detail-page">
      <Link className="back-link" to="/">
        Back to listings
      </Link>

      <section className="detail-hero">
        <PropertyImageGallery alt={address} photos={photoUrls} />

        <div className="detail-summary">
          <p className="property-price detail-price">{formatPrice(property.L_SystemPrice)}</p>
          <h1>{address}</h1>
          <p className="property-location">{cityStateZip || 'Location unavailable'}</p>

          <dl className="detail-stats" aria-label="Property stats">
            <DetailItem label="Beds" value={formatNumber(property.L_Keyword2)} />
            <DetailItem label="Baths" value={formatNumber(property.LM_Dec_3)} />
            <DetailItem label="Sqft" value={formatNumber(property.LM_Int2_3)} />
            <DetailItem label="Year" value={yearBuilt} />
          </dl>
        </div>
      </section>

      <section className="detail-section">
        <h2>Description</h2>
        <p className="detail-description">{property.L_Remarks || 'No description available.'}</p>
      </section>

      <section className="detail-section">
        <h2>Property Details</h2>
        <dl className="detail-list">
          <DetailItem label="Listing ID" value={property.L_ListingID} />
          <DetailItem label="Display ID" value={property.L_DisplayId} />
          <DetailItem label="Property Type" value={propertyType} />
          <DetailItem label="Status" value={status} />
          <DetailItem label="Lot Size" value={lotSize ? `${formatNumber(lotSize)} sqft` : ''} />
          <DetailItem label="Photos" value={String(photoUrls.length)} />
        </dl>
      </section>

      <PropertyMap property={property} />

      <section className="detail-section open-houses">
        <h2>Open Houses</h2>
        {openHouses.length > 0 ? (
          <div className="open-house-list">
            {openHouses.map((openHouse) => {
              const remarks = getOpenHouseRemarks(openHouse);

              return (
                <article
                  className="open-house-card"
                  key={`${openHouse.L_ListingID}-${openHouse.OpenHouseDate}-${openHouse.OH_StartTime}`}
                >
                  <h3>{formatOpenHouseDate(openHouse.OpenHouseDate || openHouse.OH_StartDate)}</h3>
                  <p>{formatOpenHouseTimeRange(openHouse.OH_StartTime, openHouse.OH_EndTime)}</p>
                  <p className="open-house-remarks">
                    {remarks || 'No open house remarks available.'}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-copy">No open houses scheduled.</p>
        )}
      </section>
    </main>
  );
}
