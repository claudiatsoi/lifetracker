import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Sprout } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { routes } from "@/routes";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const prepareAdd = useAppStore(state => state.prepareAdd);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      mainRef.current?.focus();
      window.scrollTo({ top: 0 });
    }
    previousPath.current = pathname;
  }, [pathname]);
  function navigation(mobile: boolean) {
    return routes.filter(route => route.label).map(route => {
      const Icon = route.icon;
      return <NavLink key={route.path} to={route.path} end={route.path === "/"} onClick={() => { if (route.path === "/add-record" && pathname !== route.path) prepareAdd(); }} className={({ isActive }) => cn(
        buttonVariants({ variant: isActive ? "default" : "ghost" }),
        "h-auto min-w-0 whitespace-normal py-3 text-center focus-visible:outline-offset-2",
        mobile && "flex-col gap-1 px-2",
        isActive ? "font-semibold underline underline-offset-4 forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]" : "forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
      )}>{Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}<span className="min-w-0 break-words">{route.label}</span></NavLink>;
    });
  }
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground" lang="zh-Hant">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3 focus-visible:outline-2 focus-visible:outline-ring">跳至主要內容</a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sprout className="size-5" aria-hidden="true" /></span><span className="min-w-0 break-words text-sm font-semibold tracking-tight">Life Progress Tracker</span></div>
          <nav aria-label="主要導覽" className="hidden min-w-0 flex-wrap gap-2 md:flex">{navigation(false)}</nav>
        </div>
      </header>
      <main ref={mainRef} id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none"><Outlet /></main>
      <nav aria-label="主要導覽（手機）" className="sticky bottom-0 z-40 grid grid-cols-2 gap-3 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">{navigation(true)}</nav>
      <Toaster />
    </div>
  );
}

export default AppShell;
