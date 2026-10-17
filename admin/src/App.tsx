import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./auth/LoginPage";
import { EventForm } from "./forms/EventForm";
import { NoticeForm } from "./forms/NoticeForm";
import { PlaceForm } from "./forms/PlaceForm";
import { AdminLayout } from "./layout/AdminLayout";
import { EventList, NoticeList, PlaceList } from "./list/lists";

/** The admin's screens (docs/02-information-architecture.md, section 2 Admin). */
export const routes = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <AdminLayout />,
    children: [
      { path: "/", element: <Navigate to="/places" replace /> },
      { path: "/places", element: <PlaceList /> },
      { path: "/places/new", element: <PlaceForm /> },
      { path: "/places/:id", element: <PlaceForm /> },
      { path: "/events", element: <EventList /> },
      { path: "/events/new", element: <EventForm /> },
      { path: "/events/:id", element: <EventForm /> },
      { path: "/notices", element: <NoticeList /> },
      { path: "/notices/new", element: <NoticeForm /> },
      { path: "/notices/:id", element: <NoticeForm /> },
      { path: "*", element: <Navigate to="/places" replace /> },
    ],
  },
];

export function createRouter() {
  return createBrowserRouter(routes);
}
