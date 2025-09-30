"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function DebugClient() {
  const pathname = usePathname();
  const params = useSearchParams();
  const enabled = params?.get('debug') === '1';

  useEffect(() => {
    if (!enabled) return;

    const post = async (payload: any) => {
      try {
        await fetch('/api/debug/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    };

    const captureOnce = (reason: any, label: string) => {
      const msg = String(reason?.message || reason || '');
      const src = String((reason?.srcElement?.src || reason?.target?.src || ''));
      const url = src || (typeof reason === 'string' ? reason : '');
      const perf = (performance && performance.now && performance.now()) || 0;
      post({ type: label, pathname, msg, url, perf });
      // Also compare with server chunk listing for the route
      const routeBase = (pathname || '/').replace(/^\//, '').split('/')[0] || '';
      fetch(`/api/debug/chunks?route=${encodeURIComponent(routeBase)}`).then((r) => r.json()).then((data) => {
        post({ type: 'chunks', routeBase, data });
      }).catch(() => {});
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const text = String(reason || '');
      if (text.includes('ChunkLoadError') || text.includes('/_next/static/chunks/')) {
        captureOnce(reason, 'unhandledrejection');
      }
    };

    const onError = (e: any) => {
      const target = e?.target as any;
      if (target && target.tagName === 'SCRIPT' && typeof target.src === 'string' && target.src.includes('/_next/static/')) {
        captureOnce({ message: 'script error', srcElement: target, target }, 'script-error');
      }
    };

    // Initial snapshot
    fetch('/api/debug/build').then((r) => r.json()).then((info) => post({ type: 'build', info, pathname })).catch(() => {});

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError, true);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError, true);
    };
  }, [enabled, pathname, params]);

  return null;
}

