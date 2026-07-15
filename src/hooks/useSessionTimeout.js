import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';

const INACTIVITY_MS = 30 * 60 * 1000;      // 30 min idle
const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 h absolute
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const lastActivity = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStart.current = Date.now();
    const touch = () => { lastActivity.current = Date.now(); };
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > INACTIVITY_MS ||
          now - sessionStart.current > MAX_SESSION_MS) {
        logout();
      }
    }, 60 * 1000);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);
}
