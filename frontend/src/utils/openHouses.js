export function getOpenHouseRemarks(openHouse) {
  const allData = parseAllData(openHouse?.all_data);

  return (
    allData.OpenHouseRemarks ||
    allData.OpenHouseRemark ||
    allData.OH_Remarks ||
    allData.Remarks ||
    ''
  );
}

export function formatOpenHouseDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatOpenHouseTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end || 'Time unavailable';
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  const text = String(value);
  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return text;
  }

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function parseAllData(allDataValue) {
  if (!allDataValue) {
    return {};
  }

  if (typeof allDataValue === 'object') {
    return allDataValue;
  }

  if (typeof allDataValue !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(allDataValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
