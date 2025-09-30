"use client";

import { useEffect } from 'react';

export default function ChunkErrorReload() {
  useEffect(() => {
    const mark = '__chunk_reloaded_once__';
    const tryReload = () => {
      if (typeof window === 'undefined') return;
      try {
        if (!sessionStorage.getItem(mark)) {
          sessionStorage.setItem(mark, '1');
          // Add a cache-busting param to bypass any intermediary caches
          const url = new URL(window.location.href);
          url.searchParams.set('__r', Date.now().toString());
          window.location.replace(url.toString());
        }
      } catch {
        const url = new URL(window.location.href);
        url.searchParams.set('__r', Date.now().toString());
        window.location.replace(url.toString());
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = String((e as any)?.reason || '');
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        tryReload();
      }
    };

    const onError = (e: Event) => {
      const target = e?.target as any;
      if (target && target.tagName === 'SCRIPT' && typeof target.src === 'string') {
        if (target.src.includes('/_next/static/chunks/')) {
          tryReload();
        }
      }
    };

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError, true);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  return null;
}
