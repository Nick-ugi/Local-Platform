"use client";

import { type OpenStatus, openStatus, parseOpeningHours } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const MINUTE = 60 * 1000;

const tone = {
  open: "bg-green-50 text-green-800",
  soon: "bg-amber-50 text-amber-800",
  closed: "bg-neutral-100 text-neutral-700",
};

/**
 * Whether a place is open now (PLACE-07), from OpenStreetMap opening hours, in New Zealand time.
 * Hours that cannot be read say nothing: a wrong "Open now" is worse than none. The page is drawn on
 * the server without the badge and the browser fills it in, so the two never disagree about the time;
 * after that it follows the clock minute by minute.
 */
export function OpenBadge({ openingHours, className = "" }: { openingHours: string | null; className?: string }) {
  const t = useTranslations("Hours");
  const hours = useMemo(() => parseOpeningHours(openingHours), [openingHours]);
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    if (!hours) {
      return;
    }
    const update = () => setStatus(openStatus(hours, new Date()));
    const first = setTimeout(update, 0);
    const every = setInterval(update, MINUTE);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [hours]);

  if (!hours || !status) {
    return null;
  }

  let text: string;
  let look: string;
  if (status.state === "open") {
    look = status.soon ? tone.soon : tone.open;
    text =
      status.closesAt === null
        ? t("always")
        : status.soon
          ? t("closesSoon", { time: status.closesAt })
          : t("openUntil", { time: status.closesAt });
  } else {
    look = tone.closed;
    text =
      status.opensAt === null
        ? t("closed")
        : status.opensAt.day === null
          ? t("opensAt", { time: status.opensAt.time })
          : t("opensOn", { day: status.opensAt.day, time: status.opensAt.time });
  }

  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${look} ${className}`}>{text}</span>;
}
