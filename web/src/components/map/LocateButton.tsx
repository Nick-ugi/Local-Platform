import { useTranslations } from "next-intl";

type Props = {
  onClick: () => void;
  /** True while the browser is finding the position. */
  busy: boolean;
};

/** The current location button of the map (wireframe m-map). The screen decides where it sits. */
export function LocateButton({ onClick, busy }: Props) {
  const t = useTranslations("Map");

  return (
    <button
      type="button"
      aria-label={t("locate")}
      aria-busy={busy}
      disabled={busy}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-full border border-neutral-400 bg-white shadow-md disabled:opacity-60"
    >
      {/* A ring with a dot: the usual sign for "my position". */}
      <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full border-2 border-neutral-950">
        <span className="size-1.5 rounded-full bg-neutral-950" />
      </span>
    </button>
  );
}
