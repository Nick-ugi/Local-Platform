import { categoryStyle, type EventSummary, formatEventWhen } from "@queenstown/shared";
import Link from "next/link";
import { KindPlaceholder } from "@/components/place/KindArt";
import { PlaceImage } from "@/components/place/PlaceImage";

const imageClass = "h-16 w-24 shrink-0 rounded-lg object-cover";

/** An event in the list (m-events): picture, title, when it is on, where. */
export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      href={`/events/${encodeURIComponent(event.slug)}`}
      className="flex min-h-11 items-center gap-3 px-4 py-3 [overflow-wrap:anywhere]"
    >
      {/* The title is right beside the picture, so the picture itself says nothing more. */}
      <PlaceImage
        src={event.imageUrl}
        alt=""
        className={imageClass}
        fallback={<KindPlaceholder look={categoryStyle("event")} className={imageClass} />}
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{event.title}</h2>
        <p className="text-sm text-neutral-600">{formatEventWhen(event.startsAt, event.endsAt)}</p>
        <p className="text-sm text-neutral-600">{event.venueName}</p>
      </div>
    </Link>
  );
}
