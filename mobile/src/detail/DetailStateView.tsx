import { useTranslations } from "use-intl";
import { StateMessage } from "@/ui/StateMessage";

type Props = {
  status: "loading" | "notFound" | "error";
  retry: () => void;
  onGoToMap: () => void;
  onGoToExplore: () => void;
};

/**
 * A detail screen before its content (COMMON-02): loading, a failure to try again, or a place,
 * event or notice that does not exist or is no longer public, with the way to Map and Explore.
 */
export function DetailStateView({ status, retry, onGoToMap, onGoToExplore }: Props) {
  const t = useTranslations("State");

  if (status === "loading") {
    return <StateMessage loading text={t("loading")} />;
  }
  if (status === "error") {
    return (
      <StateMessage title={t("errorTitle")} text={t("errorBody")} actions={[{ label: t("retry"), onPress: retry }]} />
    );
  }
  return (
    <StateMessage
      title={t("notFoundTitle")}
      text={t("notFoundBody")}
      actions={[
        { label: t("goToMap"), onPress: onGoToMap },
        { label: t("goToExplore"), onPress: onGoToExplore },
      ]}
    />
  );
}
