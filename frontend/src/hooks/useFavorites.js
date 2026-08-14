import { useCallback, useMemo, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'idx-exchange-favorites';

function readFavorites() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function getPropertyId(property) {
  return property?.L_ListingID || property?.id;
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);
  const favoriteIds = useMemo(
    () => new Set(favorites.map((property) => String(getPropertyId(property)))),
    [favorites],
  );

  const isFavorite = useCallback(
    (propertyId) => favoriteIds.has(String(propertyId)),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((property) => {
    const propertyId = getPropertyId(property);

    if (!propertyId) {
      return;
    }

    setFavorites((currentFavorites) => {
      const isSaved = currentFavorites.some(
        (favorite) => String(getPropertyId(favorite)) === String(propertyId),
      );
      const nextFavorites = isSaved
        ? currentFavorites.filter((favorite) => String(getPropertyId(favorite)) !== String(propertyId))
        : [property, ...currentFavorites];

      writeFavorites(nextFavorites);

      return nextFavorites;
    });
  }, []);

  return {
    favoriteCount: favorites.length,
    favorites,
    isFavorite,
    toggleFavorite,
  };
}
