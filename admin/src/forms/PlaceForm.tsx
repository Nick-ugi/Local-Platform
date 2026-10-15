import {
  type AdminPlace,
  type AdminPlaceInput,
  CATEGORIES,
  type Category,
  FACILITY_SUBTYPES,
  type FacilitySubtype,
  type Status,
} from "@queenstown/shared";
import { useParams } from "react-router";
import { CATEGORY_LABELS, SUBTYPE_LABELS } from "@/lib/labels";
import { Row, SelectField, StatusField, TextField, type Values } from "./fields";
import { FormShell } from "./FormShell";
import { LocationFields } from "./LocationFields";
import { numberOf, optional, requireFields, useAdminForm } from "./useAdminForm";

const BLANK: Values = {
  name: "",
  category: "",
  subtype: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  openingHours: "",
  phone: "",
  website: "",
  imageUrl: "",
  source: "",
  sourceUrl: "",
  status: "public",
};

function toValues(place: AdminPlace): Values {
  return {
    name: place.name,
    category: place.category,
    subtype: place.subtype ?? "",
    description: place.description ?? "",
    address: place.address,
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    openingHours: place.openingHours ?? "",
    phone: place.phone ?? "",
    website: place.website ?? "",
    imageUrl: place.imageUrl ?? "",
    source: place.source,
    sourceUrl: place.sourceUrl,
    status: place.status,
  };
}

/** The required fields are checked here; the server checks every rule again (AdminPlaceRequest). */
function toInput(values: Values): { input: AdminPlaceInput } | { errors: Record<string, string> } {
  const errors = requireFields(values, ["name", "category", "address", "latitude", "longitude", "source", "sourceUrl"]);
  if (values.category === "facility" && !values.subtype) {
    errors.subtype = "is required for a facility";
  }
  const latitude = numberOf(values.latitude);
  const longitude = numberOf(values.longitude);
  if (Object.keys(errors).length > 0 || latitude === null || longitude === null) {
    return { errors };
  }
  return {
    input: {
      name: values.name.trim(),
      category: values.category as Category,
      subtype: values.category === "facility" ? (values.subtype as FacilitySubtype) : null,
      description: optional(values.description),
      address: values.address.trim(),
      latitude,
      longitude,
      openingHours: optional(values.openingHours),
      phone: optional(values.phone),
      website: optional(values.website),
      imageUrl: optional(values.imageUrl),
      source: values.source.trim(),
      sourceUrl: values.sourceUrl.trim(),
      status: values.status as Status,
    },
  };
}

/** Place 등록 / 수정 (wireframe ad-place-form, ADMIN-02). */
export function PlaceForm() {
  const { id } = useParams();
  const form = useAdminForm<AdminPlace, AdminPlaceInput>({
    path: "places",
    id: id ?? null,
    blank: BLANK,
    toValues,
    toInput,
  });
  const field = { values: form.values, errors: form.errors, onChange: form.change };
  const isFacility = form.values.category === "facility";

  return (
    <FormShell
      form={form}
      section="Places"
      path="places"
      title={id ? "Edit place" : "New place"}
      main={
        <>
          <TextField name="name" label="Name" required {...field} />
          <Row>
            <SelectField
              name="category"
              label="Category"
              required
              options={CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
              {...field}
              onChange={(name, value) => {
                form.change(name, value);
                if (value !== "facility") {
                  form.change("subtype", "");
                }
              }}
            />
            <SelectField
              name="subtype"
              label="Subtype"
              hint="(Facilities only)"
              required={isFacility}
              disabled={!isFacility}
              options={FACILITY_SUBTYPES.map((value) => ({ value, label: SUBTYPE_LABELS[value] }))}
              {...field}
            />
          </Row>
          <TextField name="description" label="Description" multiline {...field} />
          <TextField name="address" label="Address" required {...field} />
          <TextField name="openingHours" label="Opening hours" {...field} />
          <Row>
            <TextField name="phone" label="Phone" type="tel" {...field} />
            <TextField name="website" label="Website" type="url" placeholder="https://" {...field} />
          </Row>
          <TextField name="imageUrl" label="Image URL" type="url" placeholder="https://" {...field} />
          <Row>
            <TextField name="source" label="Source" required placeholder="Business website" {...field} />
            <TextField name="sourceUrl" label="Source URL" type="url" required placeholder="https://" {...field} />
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
