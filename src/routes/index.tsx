import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Factory, ShieldCheck, Sparkles } from "lucide-react";
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
    signInLocalUser(cleanEmail);
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b4fd8] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,179,255,0.45),transparent_22rem),radial-gradient(circle_at_20%_75%,rgba(37,99,235,0.6),transparent_26rem),linear-gradient(135deg,#0b5be7_0%,#0641bd_48%,#0734a3_100%)]" />
      <div className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 size-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

      <main className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-7 flex items-end justify-center gap-5">
          <div className="grid size-12 place-items-center rounded-2xl bg-white/10 text-white shadow-xl shadow-blue-950/20 ring-1 ring-white/20 backdrop-blur">
            <Sparkles className="size-6 text-red-400" />
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-[#0b4fd8] shadow-xl shadow-blue-950/20">
            <ShieldCheck className="size-7" />
          </div>
        </div>

        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/15 shadow-xl shadow-blue-950/20 ring-1 ring-white/20 backdrop-blur">
          <Factory className="size-7 text-white" />
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">SKILL MATRIX</h1>
        <p className="mt-2 text-sm font-medium text-blue-100">Production 1-LDI</p>

        <section className="mt-8 w-full rounded-2xl border border-white/30 bg-white/95 p-6 text-left text-slate-950 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <h2 className="font-display text-xl font-bold tracking-tight">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-slate-500">เข้าใช้งานระบบ Skill Matrix Production</p>
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
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
              className="w-full rounded-xl bg-[#0b4fd8] shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-[#0641bd] hover:shadow-xl hover:shadow-blue-600/30"
              size="lg"
              type="submit"
              disabled={loading || checking}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
