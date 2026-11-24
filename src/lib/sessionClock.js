// Persists session-start and last-activity timestamps across page reloads,
// so the 24h/30min caps in useSessionTimeout are anchored to the real login
// time instead of resetting whenever the browser/tab is reopened.
const START_KEY = 'ne_session_start';
const ACTIVITY_KEY = 'ne_session_last_activity';

export function markSessionStart() {
  const now = String(Date.now());
  localStorage.setItem(START_KEY, now);
  localStorage.setItem(ACTIVITY_KEY, now);
}

export function ensureSessionStart() {
  if (!localStorage.getItem(START_KEY)) markSessionStart();
}

export function getSessionStart() {
  const v = localStorage.getItem(START_KEY);
  return v ? Number(v) : null;
}

export function touchActivity() {
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

export function getLastActivity() {
  const v = localStorage.getItem(ACTIVITY_KEY);
  return v ? Number(v) : null;
}

export function clearSessionClock() {
  localStorage.removeItem(START_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
}
