import { useEffect, useState } from "react";

/**
 * True once something has been loading for `afterMs` (five seconds unless given), so a screen can
 * say why: a free-tier backend that was asleep takes up to a minute to answer its first request.
 * False again as soon as the loading ends. The web app's hook (web/src/lib/useSlow.ts).
 */
export function useSlow(active: boolean, afterMs = 5000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = setTimeout(() => setSlow(true), afterMs);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, afterMs]);

  return active && slow;
}
