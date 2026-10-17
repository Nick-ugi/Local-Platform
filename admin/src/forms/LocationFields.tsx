import { LocationPicker } from "@/map/LocationPicker";
import { type Errors, Row, TextField, type Values } from "./fields";
import { numberOf } from "./useAdminForm";

type Props = {
  values: Values;
  errors: Errors;
  required: boolean;
  change: (name: string, value: string) => void;
  changeAll: (changes: Values) => void;
};

/** The map with its pin, and the latitude and longitude fields that go with it. */
export function LocationFields({ values, errors, required, change, changeAll }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">
        Location{required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-neutral-500"> (optional)</span>}
      </span>
      <LocationPicker
        latitude={numberOf(values.latitude)}
        longitude={numberOf(values.longitude)}
        onChange={(latitude, longitude) =>
          changeAll({ latitude: String(latitude), longitude: String(longitude) })
        }
      />
      <Row>
        <TextField name="latitude" label="Latitude" type="number" values={values} errors={errors} onChange={change} />
        <TextField name="longitude" label="Longitude" type="number" values={values} errors={errors} onChange={change} />
      </Row>
      {!required && (values.latitude || values.longitude) ? (
        <button
          type="button"
          onClick={() => changeAll({ latitude: "", longitude: "" })}
          className="self-start text-sm font-semibold underline"
        >
          Clear location
        </button>
      ) : null}
    </div>
  );
}
