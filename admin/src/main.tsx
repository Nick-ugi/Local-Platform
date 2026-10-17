import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createRouter } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={createRouter()} />
    </AuthProvider>
  </StrictMode>,
);
