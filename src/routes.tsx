import type { ReactElement } from "react";
import { CalendarDays, Plus, type LucideIcon } from "lucide-react";
import { HomePage } from "@/pages/home";
import { AddRecordPage } from "@/pages/add-record";

export interface AppRoute {
  /** "/" is the index route; others are paths under the shell. */
  path: string;
  element: ReactElement;
  /** Optional nav metadata — set these only for routes that should appear in a
   *  navbar/sidebar (the shell ships none by default; map over `routes` when you
   *  add one). Omit for detail/utility routes that aren't top-level nav targets. */
  label?: string;
  icon?: LucideIcon;
}

// Single source of truth for routes. Add a page = add ONE entry here.
// `App.tsx` builds <Routes> from this array; when you add a navbar or sidebar,
// map over `routes` (e.g. filter to entries with a `label`) so the router and
// the nav can never drift out of sync. `not-found` is wired in App.tsx.
export const routes: AppRoute[] = [
  { path: "/", element: <HomePage />, label: "今天", icon: CalendarDays },
  { path: "/add-record", element: <AddRecordPage />, label: "新增記錄", icon: Plus },
];
