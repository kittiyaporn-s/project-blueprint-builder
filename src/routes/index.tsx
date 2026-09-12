import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  Factory,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocalUser, signInLocalUser } from "@/lib/local-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ | SKILL MATRIX" },
      {
        name: "description",
        content: "SKILL MATRIX Production 1-LDI",
      },
      { property: "og:title", content: "เข้าสู่ระบบ | SKILL MATRIX" },
      {
        property: "og:description",
        content: "SKILL MATRIX Production 1-LDI",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (getLocalUser()) navigate({ to: "/dashboard", replace: true });
    else setChecking(false);
  }, [navigate]);

  function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("กรุณากรอก E-mail และ password");
      return;
    }

    setError("");
    setLoading(true);
    const user = signInLocalUser(cleanEmail, password);
    if (!user) {
      setError("กรุณาเข้าสู่ระบบด้วย E-mail และ password เท่านั้น");
      setLoading(false);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#C7D2FE_0,#EEF2FF_28%,#F8FAFC_58%,#ECFEFF_100%)] px-6 py-6 text-[#0A0A0A]">
      <div className="pointer-events-none absolute -left-28 top-24 size-96 rounded-full bg-gradient-to-br from-[#6366F1]/35 via-[#8B5CF6]/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 size-[28rem] rounded-full bg-gradient-to-bl from-[#22D3EE]/35 via-[#14B8A6]/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 size-[30rem] rounded-full bg-gradient-to-tr from-[#F59E0B]/25 via-[#FB7185]/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-[0_20px_60px_rgba(79,70,229,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/25">
            <Factory className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-[-0.03em]">SKILL MATRIX</p>
            <p className="text-xs text-[#6B6B6B]">Production 1-LDI</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 sm:flex">
          <span className="size-2 rounded-full bg-emerald-500" /> พร้อมใช้งาน
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-[#4F46E5] shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" /> Modern Skill Dashboard
          </div>
          <h1 className="flex items-center gap-4 font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-slate-950 drop-shadow-sm md:text-7xl">
            <ClipboardCheck className="size-12 shrink-0 text-indigo-600 md:size-16" />
            ระบบประเมินทักษะพนักงาน Production
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            จัดการข้อมูลพนักงาน บันทึกผลประเมิน และติดตาม Skill Gap ด้วยหน้าจอที่อ่านง่าย ทันสมัย
            และพร้อมใช้งานในสายการผลิต
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Production", value: "1-LDI" },
              { label: "Employee Data", value: "2026" },
              { label: "Status", value: "Online" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_45px_rgba(79,70,229,0.10)] backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(79,70,229,0.16)]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#9C9C9C]">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/75 bg-white/85 p-6 shadow-[0_28px_80px_rgba(79,70,229,0.18)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(79,70,229,0.22)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold tracking-[-0.03em]">
                <LogIn className="size-5 text-[#6366F1]" />
                เข้าสู่ระบบ
              </h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">เข้าใช้งานระบบ Skill Matrix Production</p>
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 text-[#6366F1] shadow-inner">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4 text-[#6366F1]" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <KeyRound className="size-4 text-[#6366F1]" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={1}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#06B6D4] font-medium shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35"
              size="lg"
              type="submit"
              disabled={loading || checking}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
