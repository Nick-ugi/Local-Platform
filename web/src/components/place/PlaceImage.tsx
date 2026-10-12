"use client";

import { type ReactNode, useState } from "react";
import { httpUrl } from "@/lib/format";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  /** Shown in place of an image that is missing or cannot be loaded. */
  fallback?: ReactNode;
};

/**
 * The picture of a place. Seed data names images by URL, and an address can be wrong or go away,
 * so an image that is not an http(s) URL or fails to load gives way to the fallback.
 */
export function PlaceImage({ src, alt, className, fallback = null }: Props) {
  // The address that failed, so that a different address gets its own attempt.
  const [failed, setFailed] = useState<string | null>(null);
  const url = src ? httpUrl(src) : null;

  if (url === null || url === failed) {
    return fallback;
  }
  return (
    // Images live on the places' own sites, so there is no list of hosts for next/image to allow.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} loading="lazy" className={className} onError={() => setFailed(url)} />
  );
}
