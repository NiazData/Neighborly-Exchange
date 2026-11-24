import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ensureSessionStart, getSessionStart, getLastActivity, touchActivity } from '@/lib/sessionClock';

const configuredMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
const IDLE_MINUTES = Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 10;
const INACTIVITY_MS = IDLE_MINUTES * 60 * 1000;
const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 h absolute
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const CHECK_INTERVAL_MS = 15 * 1000;

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const lastActivity = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;
    ensureSessionStart();
    sessionStart.current = getSessionStart() ?? Date.now();
    lastActivity.current = getLastActivity() ?? Date.now();
    const touch = () => { lastActivity.current = Date.now(); touchActivity(); };
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > INACTIVITY_MS ||
          now - sessionStart.current > MAX_SESSION_MS) {
        logout();
      }
    }, CHECK_INTERVAL_MS);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);
}
