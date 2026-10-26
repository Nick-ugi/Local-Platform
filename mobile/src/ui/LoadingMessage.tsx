import { useTranslations } from "use-intl";
import { StateMessage } from "./StateMessage";
import { useSlow } from "./useSlow";

/**
 * A spinner while a screen loads, with its text if it has one, and after five seconds the news that
 * the server is waking up: a sleeping free-tier backend takes up to a minute to answer.
 */
export function LoadingMessage({ text }: { text?: string }) {
  const t = useTranslations("State");
  const slow = useSlow(true);

  return <StateMessage loading text={slow ? t("waking") : text} />;
}
