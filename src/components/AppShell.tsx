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

const PAGE_ICONS = [
  { keyword: "Dashboard", icon: LayoutDashboard, iconClass: "text-sky-500" },
  { keyword: "ข้อมูลพนักงาน", icon: Users, iconClass: "text-violet-500" },
  { keyword: "ประเมินทักษะ", icon: ClipboardCheck, iconClass: "text-emerald-500" },
  { keyword: "Skill Production", icon: Factory, iconClass: "text-amber-500" },
  { keyword: "Skill Gap", icon: TrendingUp, iconClass: "text-rose-500" },
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
  const pageIcon = PAGE_ICONS.find((item) => title.includes(item.keyword)) ?? PAGE_ICONS[0];
  const PageIcon = pageIcon.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.24),transparent_24rem),radial-gradient(circle_at_92%_4%,rgba(168,85,247,0.2),transparent_24rem),radial-gradient(circle_at_50%_100%,rgba(251,146,60,0.18),transparent_30rem),linear-gradient(135deg,#ECFEFF_0%,#EEF2FF_42%,#F8FAFC_72%,#FDF2F8_100%)]">
      <div className="pointer-events-none absolute -left-28 top-28 size-[32rem] rounded-full bg-gradient-to-br from-cyan-300/35 via-sky-400/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-16 size-[34rem] rounded-full bg-gradient-to-bl from-violet-400/30 via-indigo-400/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] left-1/3 size-[38rem] rounded-full bg-gradient-to-tr from-amber-300/30 via-rose-300/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <header className="sticky top-0 z-30 overflow-hidden border-b border-white/20 bg-gradient-to-r from-[#123C62]/95 via-[#1D3B73]/92 to-[#37246B]/92 text-sidebar-foreground shadow-2xl shadow-indigo-950/25 backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-16 -top-24 size-80 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-[-8rem] size-96 -translate-x-1/2 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-0 size-64 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />

        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/dashboard"
            className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition-all hover:bg-white/5"
          >
            <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/30 transition-all group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-orange-500/45">
              <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <Factory className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold tracking-[-0.03em]">
                SKILL MATRIX
              </span>
              <span className="block text-xs text-sidebar-foreground/70">Production 1-LDI</span>
            </span>
          </Link>
          <div className="text-foreground">
            <UserMenu />
          </div>
        </div>
        <nav className="relative mx-auto max-w-[1400px] overflow-x-auto px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-2 rounded-full border border-white/20 bg-white/12 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-xl ring-1 ring-white/10">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-sidebar-foreground/78 transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:text-sidebar-accent-foreground hover:shadow-lg hover:shadow-slate-950/10"
                  activeProps={{
                    className:
                      "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm bg-white/18 text-sidebar-accent-foreground font-semibold shadow-lg shadow-slate-950/15 ring-1 ring-white/15 backdrop-blur",
                  }}
                >
                  <item.icon
                    className={`size-4 transition-transform group-hover:scale-110 ${item.iconClass}`}
                  />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-[1400px] px-4 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-medium text-primary shadow-sm shadow-indigo-100/50 ring-1 ring-white/80 backdrop-blur">
              <Sparkles className="size-3.5 text-cyan-500" /> Modern Skill Dashboard
            </div>
            <h1 className="flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
              <PageIcon className={`size-7 ${pageIcon.iconClass}`} />
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
