import { type AdminNotice, type AdminNoticeInput, NOTICE_TYPES, type NoticeType, type Status } from "@queenstown/shared";
import { useParams } from "react-router";
import { NOTICE_TYPE_LABELS } from "@/lib/labels";
import { fromNzInput, toNzInput } from "@/lib/nzTime";
import { Row, SelectField, StatusField, TextField, type Values } from "./fields";
import { FormShell } from "./FormShell";
import { LocationFields } from "./LocationFields";
import { numberOf, optional, requireFields, useAdminForm } from "./useAdminForm";

const BLANK: Values = {
  title: "",
  type: "",
  startsAt: "",
  endsAt: "",
  summary: "",
  locationName: "",
  latitude: "",
  longitude: "",
  sourceOrg: "",
  sourceUrl: "",
  isOfficial: "false",
  status: "public",
};

function toValues(notice: AdminNotice): Values {
  return {
    title: notice.title,
    type: notice.type,
    startsAt: toNzInput(notice.startsAt),
    endsAt: toNzInput(notice.endsAt),
    summary: notice.summary,
    locationName: notice.locationName ?? "",
    latitude: notice.latitude === null ? "" : String(notice.latitude),
    longitude: notice.longitude === null ? "" : String(notice.longitude),
    sourceOrg: notice.sourceOrg,
    sourceUrl: notice.sourceUrl,
    isOfficial: String(notice.isOfficial),
    status: notice.status,
  };
}

function toInput(values: Values): { input: AdminNoticeInput } | { errors: Record<string, string> } {
  const errors = requireFields(values, ["title", "type", "startsAt", "summary", "sourceOrg", "sourceUrl"]);
  const startsAt = fromNzInput(values.startsAt);
  const endsAt = values.endsAt ? fromNzInput(values.endsAt) : null;
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    errors.endsAt = "must not be before the start";
  }
  const latitude = numberOf(values.latitude);
  const longitude = numberOf(values.longitude);
  if ((latitude === null) !== (longitude === null)) {
    errors.latitude = "needs a longitude too, or clear both";
  }
  if (Object.keys(errors).length > 0 || startsAt === null) {
    return { errors };
  }
  return {
    input: {
      title: values.title.trim(),
      type: values.type as NoticeType,
      summary: values.summary.trim(),
      startsAt,
      endsAt,
      locationName: optional(values.locationName),
      latitude,
      longitude,
      sourceOrg: values.sourceOrg.trim(),
      sourceUrl: values.sourceUrl.trim(),
      isOfficial: values.isOfficial === "true",
      status: values.status as Status,
    },
  };
}

/**
 * Notice 등록 / 수정 (wireframe ad-notice-form, ADMIN-04): title and type, period, summary, the
 * location (optional), the source with its original and Official, status.
 */
export function NoticeForm() {
  const { id } = useParams();
  const form = useAdminForm<AdminNotice, AdminNoticeInput>({ path: "notices", id: id ?? null, blank: BLANK, toValues, toInput });
  const field = { values: form.values, errors: form.errors, onChange: form.change };

  return (
    <FormShell
      form={form}
      section="Notices"
      path="notices"
      title={id ? "Edit notice" : "New notice"}
      main={
        <>
          <Row>
            <TextField name="title" label="Title" required {...field} />
            <SelectField
              name="type"
              label="Type"
              required
              options={NOTICE_TYPES.map((value) => ({ value, label: NOTICE_TYPE_LABELS[value] }))}
              {...field}
            />
          </Row>
          <Row>
            <TextField name="startsAt" label="From" hint="(NZ time)" type="datetime-local" required {...field} />
            <TextField name="endsAt" label="Until" hint="(NZ time, optional)" type="datetime-local" {...field} />
          </Row>
          <TextField name="summary" label="Summary" multiline required {...field} />
          <TextField name="locationName" label="Location name" {...field} />
          <Row>
            <TextField name="sourceOrg" label="Source organisation" required placeholder="QLDC" {...field} />
            <TextField name="sourceUrl" label="Original URL" type="url" required placeholder="https://" {...field} />
          </Row>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isOfficial"
              checked={form.values.isOfficial === "true"}
              onChange={(event) => form.change("isOfficial", String(event.target.checked))}
            />
            <span className="font-semibold">Official</span>
            <span className="text-sm text-neutral-500">From a public authority</span>
          </label>
        </>
      }
      side={
        <>
          <LocationFields
            required={false}
            values={form.values}
            errors={form.errors}
            change={form.change}
            changeAll={form.changeAll}
          />
          <StatusField values={form.values} onChange={form.change} />
        </>
      }
    />
  );
}
