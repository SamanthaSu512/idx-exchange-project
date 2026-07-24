import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProperties } from '../api/client';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';

const INITIAL_LIMIT = 20;

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    async function loadProperties() {
      setIsLoading(true);
      setError('');
      setProperties([]);
      setTotal(0);

      try {
        const data = await fetchProperties({
          ...searchFilters,
          limit: INITIAL_LIMIT,
          offset: 0,
        });

        if (latestRequestId.current !== requestId) {
          return;
        }

        setProperties(data.results || []);
        setTotal(data.total || 0);
        setLimit(data.limit || INITIAL_LIMIT);
      } catch (requestError) {
        if (latestRequestId.current !== requestId) {
          return;
        }

        setError(requestError.message);
        setProperties([]);
        setTotal(0);
      } finally {
        if (latestRequestId.current === requestId) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();
  }, [searchFilters]);

  const handleSearch = useCallback((filters) => {
    setSearchFilters(filters);
  }, []);

  const handleClear = useCallback(() => {
    setSearchFilters({});
  }, []);

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

      <PropertyFilters isLoading={isLoading} onClear={handleClear} onSearch={handleSearch} />

      {isLoading ? (
        <section className="state-panel" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading property data...</p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="state-panel error-panel" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setSearchFilters((filters) => ({ ...filters }))}>
            Retry
          </button>
        </section>
      ) : null}

      {!isLoading && !error && properties.length === 0 ? (
        <section className="state-panel empty-panel">
          <p>No properties found. Try adjusting your filters.</p>
        </section>
      ) : null}

      {!isLoading && !error && properties.length > 0 ? (
        <section className="property-grid" aria-label={`Showing ${limit} property listings`}>
          {properties.map((property) => (
            <PropertyCard key={property.L_ListingID || property.id} property={property} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
