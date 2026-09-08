import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Factory,
  TrendingUp,
} from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "ข้อมูลพนักงาน", icon: Users },
  { to: "/assessment", label: "ประเมินทักษะ", icon: ClipboardCheck },
  { to: "/skill-production", label: "Skill Production", icon: Factory },
  { to: "/skill-gap", label: "Skill Gap", icon: TrendingUp },
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
      <header className="sticky top-0 z-30 border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary font-bold text-sidebar-primary-foreground">
              SM
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
        <nav className="mx-auto max-w-[1400px] overflow-x-auto px-2 pb-2">
          <ul className="flex min-w-max gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
