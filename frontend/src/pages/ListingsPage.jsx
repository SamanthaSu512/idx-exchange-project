import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProperties } from '../api/client';
import Pagination from '../components/Pagination';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';

const INITIAL_LIMIT = 20;

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(INITIAL_LIMIT);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestId = useRef(0);
  const totalPages = Math.ceil(total / itemsPerPage);
  const firstResult = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastResult = Math.min(currentPage * itemsPerPage, total);
  const resultSummary = isLoading
    ? 'Loading properties...'
    : `Showing ${firstResult}-${lastResult} of ${total} properties`;

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
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        });

        if (latestRequestId.current !== requestId) {
          return;
        }

        setProperties(data.results || []);
        setTotal(data.total || 0);
        setItemsPerPage(data.limit || INITIAL_LIMIT);
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
  }, [currentPage, itemsPerPage, searchFilters]);

  const handleSearch = useCallback((filters) => {
    setCurrentPage(1);
    setSearchFilters(filters);
  }, []);

  const handleClear = useCallback(() => {
    setCurrentPage(1);
    setSearchFilters({});
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="listings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">IDX Exchange</p>
          <h1>Property Listings</h1>
        </div>
        <p className="result-count">{resultSummary}</p>
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
        <>
          <section className="property-grid" aria-label={resultSummary}>
            {properties.map((property) => (
              <Link
                className="property-card-link"
                key={property.L_ListingID || property.id}
                to={`/property/${encodeURIComponent(property.L_ListingID)}`}
              >
                <PropertyCard property={property} />
              </Link>
            ))}
          </section>
          <Pagination
            currentPage={currentPage}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </>
      ) : null}
    </main>
  );
}
