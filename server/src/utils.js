export function localDateKey(date = new Date()) {
  // Uses the server's local timezone. Set the server timezone intentionally in production.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function estimateWait(position, averageMinutes) {
  return Math.max(0, Number(position) || 0) * Math.max(1, Number(averageMinutes) || 5);
}
