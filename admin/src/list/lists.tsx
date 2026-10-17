import {
  type AdminEvent,
  type AdminNotice,
  type AdminPlace,
  CATEGORIES,
  formatEventWhen,
  NOTICE_TYPES,
  STATUSES,
} from "@queenstown/shared";
import { CATEGORY_LABELS, NOTICE_TYPE_LABELS, STATUS_LABELS, SUBTYPE_LABELS } from "@/lib/labels";
import { formatNzDate } from "@/lib/nzTime";
import { ListPage, StatusBadge } from "./ListPage";

const statusFilter = {
  name: "status",
  allLabel: "All status",
  options: STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
};

/** Places (wireframe ad-places, ADMIN-02). */
export function PlaceList() {
  return (
    <ListPage<AdminPlace>
      title="Places"
      path="places"
      newLabel="New place"
      searchLabel="Search by name"
      filters={[
        {
          name: "category",
          allLabel: "All categories",
          options: CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
        },
        statusFilter,
      ]}
      columns={[
        { header: "Name", cell: (place) => place.name },
        {
          header: "Category",
          cell: (place) =>
            place.subtype ? `${CATEGORY_LABELS[place.category]} · ${SUBTYPE_LABELS[place.subtype]}` : CATEGORY_LABELS[place.category],
        },
        { header: "Status", cell: (place) => <StatusBadge status={place.status} /> },
        { header: "Updated", cell: (place) => formatNzDate(place.updatedAt) },
      ]}
    />
  );
}

/** Events (ADMIN-03): the same layout, with when they are on. */
export function EventList() {
  return (
    <ListPage<AdminEvent>
      title="Events"
      path="events"
      newLabel="New event"
      searchLabel="Search by title"
      filters={[statusFilter]}
      columns={[
        { header: "Title", cell: (event) => event.title },
        { header: "When", cell: (event) => formatEventWhen(event.startsAt, event.endsAt, { year: true }) },
        { header: "Status", cell: (event) => <StatusBadge status={event.status} /> },
        { header: "Updated", cell: (event) => formatNzDate(event.updatedAt) },
      ]}
    />
  );
}

/** Notices (ADMIN-04): the same layout, filtered by type. */
export function NoticeList() {
  return (
    <ListPage<AdminNotice>
      title="Notices"
      path="notices"
      newLabel="New notice"
      searchLabel="Search by title"
      filters={[
        {
          name: "type",
          allLabel: "All types",
          options: NOTICE_TYPES.map((value) => ({ value, label: NOTICE_TYPE_LABELS[value] })),
        },
        statusFilter,
      ]}
      columns={[
        { header: "Title", cell: (notice) => notice.title },
        { header: "Type", cell: (notice) => NOTICE_TYPE_LABELS[notice.type] },
        { header: "Status", cell: (notice) => <StatusBadge status={notice.status} /> },
        { header: "Updated", cell: (notice) => formatNzDate(notice.updatedAt) },
      ]}
    />
  );
}
