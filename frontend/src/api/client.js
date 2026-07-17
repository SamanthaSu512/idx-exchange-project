async function requestJson(path) {
  const response = await fetch(path);
  let body;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function fetchProperties(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();

  return requestJson(`/api/properties${queryString ? `?${queryString}` : ''}`);
}

export function fetchPropertyDetail(id) {
  return requestJson(`/api/properties/${encodeURIComponent(id)}`);
}
