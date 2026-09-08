import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalUser, signInLocalUser } from "@/lib/local-auth";

const FEATURES = [
  {
    icon: BarChart3,
    title: "ภาพรวมทักษะทั้งแผนก",
    desc: "Dashboard สรุปกำลังคนและระดับทักษะ",
    iconClass: "from-sky-300 to-blue-500",
  },
  {
    icon: GraduationCap,
    title: "วางแผน Training ตรงจุด",
    desc: "รู้ทันทีว่าใครต้องพัฒนาทักษะใด",
    iconClass: "from-amber-300 to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "ระบุ Trainer ได้ทันที",
    desc: "ค้นหาผู้ที่สอนงานได้ในแต่ละทักษะ",
    iconClass: "from-emerald-300 to-teal-500",
  },
] as const;

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ | SKILL MATRIX Production 1-LDI" },
      {
        name: "description",
        content:
          "ระบบ SKILL MATRIX สำหรับแผนก Production 1-LDI บันทึก ประเมิน และวิเคราะห์ทักษะพนักงาน เก็บข้อมูลใน localStorage ก่อน",
      },
      { property: "og:title", content: "เข้าสู่ระบบ | SKILL MATRIX Production 1-LDI" },
      {
        property: "og:description",
        content: "ระบบบันทึกและวิเคราะห์ทักษะพนักงานของแผนก Production 1-LDI",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (getLocalUser()) navigate({ to: "/dashboard", replace: true });
    else setChecking(false);
  }, [navigate]);

  function signIn() {
    setLoading(true);
    signInLocalUser();
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen overflow-hidden bg-background lg:grid-cols-2">
      <div className="relative flex flex-col justify-center overflow-hidden bg-sidebar px-8 py-14 text-sidebar-foreground lg:px-16">
        <div className="absolute -left-24 top-12 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 size-80 rounded-full bg-violet-500/20 blur-3xl" />
        <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 font-bold text-white shadow-xl shadow-cyan-500/25">
          SM
        </span>
        <h1 className="relative mt-6 font-display text-5xl font-semibold tracking-tight">
          SKILL MATRIX
        </h1>
        <p className="relative mt-2 text-sidebar-foreground/80">
          ระบบบริหารทักษะพนักงาน แผนก Production 1-LDI
        </p>
        <ul className="relative mt-10 space-y-5">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${f.iconClass} text-white shadow-lg shadow-slate-950/20`}
              >
                <f.icon className="size-5" />
              </span>
              <div>
                <div className="font-medium">{f.title}</div>
                <div className="text-sm text-sidebar-foreground/70">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="panel w-full max-w-sm p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25">
            <ShieldCheck className="size-7" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            เข้าใช้งานแบบ localStorage ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้ก่อน
          </p>
          <Button
            className="mt-8 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
            size="lg"
            onClick={signIn}
            disabled={loading || checking}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าใช้งานแบบ Local"}
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            โหมดชั่วคราวก่อนเชื่อมต่อฐานข้อมูลจริง
          </p>
        </div>
      </div>
    </div>
  );
}
