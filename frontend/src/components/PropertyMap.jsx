export default function PropertyMap({ property }) {
  const latitude = property.LMD_MP_Latitude;
  const longitude = property.LMD_MP_Longitude;
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
  const directionsUrl = hasLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${latitude},${longitude}`,
      )}`
    : '';

  if (!hasLocation) {
    return (
      <section className="detail-section property-map">
        <h2>Map</h2>
        <div className="map-fallback">Map location is not available for this property.</div>
      </section>
    );
  }

  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        apiKey,
      )}&q=${encodeURIComponent(`${latitude},${longitude}`)}&zoom=15`
    : '';

  return (
    <section className="detail-section property-map">
      <div className="section-heading-row">
        <h2>Map</h2>
        <a href={directionsUrl} target="_blank" rel="noreferrer">
          Get Directions
        </a>
      </div>

      {embedUrl ? (
        <iframe title="Property location map" src={embedUrl} loading="lazy" allowFullScreen />
      ) : (
        <div className="map-fallback">
          Add REACT_APP_GOOGLE_MAPS_API_KEY to frontend/.env and restart the frontend server to
          show the embedded map.
        </div>
      )}
    </section>
  );
}
