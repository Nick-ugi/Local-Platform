import type { AdminEvent, AdminEventInput, Status } from "@queenstown/shared";
import { useParams } from "react-router";
import { fromNzInput, toNzInput } from "@/lib/nzTime";
import { Row, StatusField, TextField, type Values } from "./fields";
import { FormShell } from "./FormShell";
import { LocationFields } from "./LocationFields";
import { numberOf, optional, requireFields, useAdminForm } from "./useAdminForm";

const BLANK: Values = {
  title: "",
  startsAt: "",
  endsAt: "",
  venueName: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  imageUrl: "",
  source: "",
  sourceUrl: "",
  status: "public",
};

function toValues(event: AdminEvent): Values {
  return {
    title: event.title,
    startsAt: toNzInput(event.startsAt),
    endsAt: toNzInput(event.endsAt),
    venueName: event.venueName,
    address: event.address ?? "",
    latitude: String(event.latitude),
    longitude: String(event.longitude),
    description: event.description ?? "",
    imageUrl: event.imageUrl ?? "",
    source: event.source,
    sourceUrl: event.sourceUrl,
    status: event.status,
  };
}

function toInput(values: Values): { input: AdminEventInput } | { errors: Record<string, string> } {
  const errors = requireFields(values, ["title", "startsAt", "venueName", "latitude", "longitude", "source", "sourceUrl"]);
  const startsAt = fromNzInput(values.startsAt);
  const endsAt = values.endsAt ? fromNzInput(values.endsAt) : null;
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    errors.endsAt = "must not be before the start";
  }
  const latitude = numberOf(values.latitude);
  const longitude = numberOf(values.longitude);
  if (Object.keys(errors).length > 0 || startsAt === null || latitude === null || longitude === null) {
    return { errors };
  }
  return {
    input: {
      title: values.title.trim(),
      description: optional(values.description),
      startsAt,
      endsAt,
      venueName: values.venueName.trim(),
      address: optional(values.address),
      latitude,
      longitude,
      imageUrl: optional(values.imageUrl),
      source: values.source.trim(),
      sourceUrl: values.sourceUrl.trim(),
      status: values.status as Status,
    },
  };
}

/**
 * Event 등록 / 수정 (ADMIN-03, docs/02-information-architecture.md section 3): title, when, where
 * with the pin, description, image, source, status. Times are typed in New Zealand time.
 */
export function EventForm() {
  const { id } = useParams();
  const form = useAdminForm<AdminEvent, AdminEventInput>({ path: "events", id: id ?? null, blank: BLANK, toValues, toInput });
  const field = { values: form.values, errors: form.errors, onChange: form.change };

  return (
    <FormShell
      form={form}
      section="Events"
      path="events"
      title={id ? "Edit event" : "New event"}
      main={
        <>
          <TextField name="title" label="Title" required {...field} />
          <Row>
            <TextField name="startsAt" label="Starts" hint="(NZ time)" type="datetime-local" required {...field} />
            <TextField name="endsAt" label="Ends" hint="(NZ time, optional)" type="datetime-local" {...field} />
          </Row>
          <Row>
            <TextField name="venueName" label="Venue" required {...field} />
            <TextField name="address" label="Address" {...field} />
          </Row>
          <TextField name="description" label="Description" multiline {...field} />
          <TextField name="imageUrl" label="Image URL" type="url" placeholder="https://" {...field} />
          <Row>
            <TextField name="source" label="Source" required placeholder="Organiser" {...field} />
            <TextField name="sourceUrl" label="Official event page" type="url" required placeholder="https://" {...field} />
          </Row>
        </>
      }
      side={
        <>
          <LocationFields required values={form.values} errors={form.errors} change={form.change} changeAll={form.changeAll} />
          <StatusField values={form.values} onChange={form.change} />
        </>
      }
    />
  );
}
