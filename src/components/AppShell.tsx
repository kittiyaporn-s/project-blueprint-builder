import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Factory,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, iconClass: "text-sky-300" },
  { to: "/employees", label: "ข้อมูลพนักงาน", icon: Users, iconClass: "text-violet-300" },
  { to: "/assessment", label: "ประเมินทักษะ", icon: ClipboardCheck, iconClass: "text-emerald-300" },
  {
    to: "/skill-production",
    label: "Skill Production",
    icon: Factory,
    iconClass: "text-amber-300",
  },
  { to: "/skill-gap", label: "Skill Gap", icon: TrendingUp, iconClass: "text-rose-300" },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/25 transition-transform group-hover:scale-105">
              <Factory className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-wide">SKILL MATRIX</span>
              <span className="block text-xs text-sidebar-foreground/70">Production 1-LDI</span>
            </span>
          </Link>
          <div className="text-foreground">
            <UserMenu />
          </div>
        </div>
        <nav className="mx-auto max-w-[1400px] overflow-x-auto px-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 transition-all hover:bg-white/10 hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white/15 text-sidebar-accent-foreground font-medium shadow-sm ring-1 ring-white/10",
                  }}
                >
                  <item.icon className={`size-4 ${item.iconClass}`} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary shadow-sm ring-1 ring-white/80">
              <Sparkles className="size-3.5 text-cyan-500" /> Modern Skill Dashboard
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
