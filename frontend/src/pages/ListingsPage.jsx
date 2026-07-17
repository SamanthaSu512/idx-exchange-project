import { useEffect, useState } from 'react';
import { fetchProperties } from '../api/client';
import PropertyCard from '../components/PropertyCard';

const INITIAL_LIMIT = 20;

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadProperties() {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchProperties({ limit: INITIAL_LIMIT, offset: 0 });

        if (!isCurrent) {
          return;
        }

        setProperties(data.results || []);
        setTotal(data.total || 0);
        setLimit(data.limit || INITIAL_LIMIT);
      } catch (requestError) {
        if (!isCurrent) {
          return;
        }

        setError(requestError.message);
        setProperties([]);
        setTotal(0);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  return (
    <main className="listings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">IDX Exchange</p>
          <h1>Property Listings</h1>
        </div>
        <p className="result-count">
          {isLoading ? 'Loading properties...' : `Showing ${properties.length} of ${total} properties`}
        </p>
      </header>

      {isLoading ? (
        <section className="state-panel" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading property data...</p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="state-panel error-panel" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </section>
      ) : null}

      {!isLoading && !error ? (
        <section className="property-grid" aria-label={`Showing ${limit} property listings`}>
          {properties.map((property) => (
            <PropertyCard key={property.L_ListingID || property.id} property={property} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
