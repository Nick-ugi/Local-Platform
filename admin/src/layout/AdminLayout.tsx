import { Navigate, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "@/auth/AuthProvider";

const SECTIONS = [
  { to: "/places", label: "Places" },
  { to: "/events", label: "Events" },
  { to: "/notices", label: "Notices" },
];

/**
 * The frame of every admin screen (wireframe ad-places): the menu on the left with Log out at the
 * bottom, the screen on the right. Without a signed-in admin it goes to Log in and comes back.
 */
export function AdminLayout() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "checking") {
    return <p className="p-8 text-neutral-600">Loading…</p>;
  }
  if (auth.status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <div className="flex min-h-screen">
      <nav aria-label="Admin" className="flex w-56 shrink-0 flex-col gap-1 border-r border-neutral-300 p-4">
        <p className="px-3 pb-4 text-xl font-bold">Admin</p>
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-semibold ${isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`
            }
          >
            {section.label}
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col gap-1">
          <p className="truncate px-3 text-xs text-neutral-500">{auth.user?.email}</p>
          <button
            type="button"
            onClick={() => void auth.logout()}
            className="rounded-lg px-3 py-2 text-left text-neutral-700 hover:bg-neutral-100"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
