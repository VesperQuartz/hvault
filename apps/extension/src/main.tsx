import "@hvault/ui/globals.css";
import {
  createHashHistory,
  createRouter,
  parseSearchWith,
  RouterProvider,
  stringifySearchWith,
} from "@tanstack/react-router";
import { parse, stringify } from "jsurl2";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals.ts";
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./store/index.ts";

const memoryHistory = createHashHistory();
// Create a new router instance
const router = createRouter({
  history: memoryHistory,
  parseSearch: parseSearchWith(parse),
  stringifySearch: stringifySearchWith(stringify),
  routeTree,
  context: {
    auth: undefined,
    queryClient: undefined,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const InnerRouter = () => {
  const auth = useAuthStore();
  return <RouterProvider router={router} context={{ auth: auth.token }} />;
};

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <InnerRouter />
    </StrictMode>,
  );
}

reportWebVitals(console.log);
