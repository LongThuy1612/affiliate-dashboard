'use client';

import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Drop-in replacement for `<img src={resolveAssetUrl(...)}>` when the backend
 * is served through a tunnel (ngrok free tier) that shows an HTML interstitial
 * warning page to any request missing the `ngrok-skip-browser-warning` header.
 * A plain `<img>` tag can't set custom headers — the browser sends a bare GET —
 * so on any device/browser that hasn't already "passed" that tunnel's warning
 * once, every image silently rendered as broken. Confirmed live: curl without
 * the header got back ngrok's warning HTML instead of the PNG.
 *
 * Fetches the image via `fetch()` (which CAN set the header, same as every
 * other API call in this app) and renders it from a blob URL instead.
 */
export default function RemoteImage({ src, alt, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setFailed(false);
    setBlobUrl(null);

    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) return null;
  if (!blobUrl) return <div className={className} />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className={className} />;
}
