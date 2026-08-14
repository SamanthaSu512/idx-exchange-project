import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProperties } from '../api/client';
import Pagination from '../components/Pagination';
import PropertyFilters from '../components/PropertyFilters';
import PropertyCard from '../components/PropertyCard';
import SortControls from '../components/SortControls';
import useFavorites from '../hooks/useFavorites';

const INITIAL_LIMIT = 20;
const DEFAULT_SORT = {
  sortBy: '',
  sortOrder: 'asc',
};

export default function ListingsPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(INITIAL_LIMIT);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [activeView, setActiveView] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const { favoriteCount, favorites, isFavorite, toggleFavorite } = useFavorites();
  const latestRequestId = useRef(0);
  const isFavoritesView = activeView === 'favorites';
  const totalPages = Math.ceil(total / itemsPerPage);
  const firstResult = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastResult = Math.min(currentPage * itemsPerPage, total);
  const visibleProperties = isFavoritesView ? favorites : properties;
  const resultSummary = isFavoritesView
    ? `${favoriteCount} saved ${favoriteCount === 1 ? 'property' : 'properties'}`
    : isLoading
    ? 'Loading properties...'
    : `Showing ${firstResult}-${lastResult} of ${total} properties`;

  useEffect(() => {
    if (isFavoritesView) {
      setIsLoading(false);
      return;
    }

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
          ...(sort.sortBy ? sort : {}),
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
  }, [currentPage, isFavoritesView, itemsPerPage, searchFilters, sort]);

  const handleSearch = useCallback((filters) => {
    setCurrentPage(1);
    setSort(DEFAULT_SORT);
    setSearchFilters(filters);
  }, []);

  const handleClear = useCallback(() => {
    setCurrentPage(1);
    setSort(DEFAULT_SORT);
    setSearchFilters({});
  }, []);

  const handleSortChange = useCallback((nextSort) => {
    setCurrentPage(1);
    setSort(nextSort);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handlePropertyOpen = useCallback(
    (listingId) => {
      navigate(`/property/${encodeURIComponent(listingId)}`);
    },
    [navigate],
  );

  return (
    <main className="listings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">IDX Exchange</p>
          <h1>Property Listings</h1>
        </div>
        <p className="result-count">{resultSummary}</p>
      </header>

      <div className="view-tabs" role="tablist" aria-label="Listing views">
        <button
          type="button"
          className={activeView === 'listings' ? 'is-active' : ''}
          onClick={() => setActiveView('listings')}
        >
          All Listings
        </button>
        <button
          type="button"
          className={activeView === 'favorites' ? 'is-active' : ''}
          onClick={() => setActiveView('favorites')}
        >
          Favorites ({favoriteCount})
        </button>
      </div>

      {!isFavoritesView ? (
        <>
          <PropertyFilters isLoading={isLoading} onClear={handleClear} onSearch={handleSearch} />
          <SortControls
            disabled={isLoading}
            onChange={handleSortChange}
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
          />
        </>
      ) : null}

      {!isFavoritesView && isLoading ? (
        <section className="state-panel" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading property data...</p>
        </section>
      ) : null}

      {!isFavoritesView && !isLoading && error ? (
        <section className="state-panel error-panel" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setSearchFilters((filters) => ({ ...filters }))}>
            Retry
          </button>
        </section>
      ) : null}

      {!isLoading && !error && visibleProperties.length === 0 ? (
        <section className="state-panel empty-panel">
          <p>
            {isFavoritesView
              ? 'No favorites saved yet. Heart a property to save it here.'
              : 'No properties found. Try adjusting your filters.'}
          </p>
        </section>
      ) : null}

      {!isLoading && !error && visibleProperties.length > 0 ? (
        <>
          <section className="property-grid" aria-label={resultSummary}>
            {visibleProperties.map((property) => (
              <PropertyCard
                isFavorite={isFavorite(property.L_ListingID || property.id)}
                key={property.L_ListingID || property.id}
                onOpen={() => handlePropertyOpen(property.L_ListingID)}
                onToggleFavorite={toggleFavorite}
                property={property}
              />
            ))}
          </section>
          {!isFavoritesView ? (
            <Pagination
              currentPage={currentPage}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
