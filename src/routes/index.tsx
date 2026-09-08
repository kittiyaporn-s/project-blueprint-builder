import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, BarChart3, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ | SKILL MATRIX Production 1-LDI" },
      {
        name: "description",
        content:
          "ระบบ SKILL MATRIX สำหรับแผนก Production 1-LDI บันทึก ประเมิน และวิเคราะห์ทักษะพนักงาน เข้าสู่ระบบด้วยบัญชี Microsoft",
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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  async function signIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("microsoft", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-sidebar px-8 py-14 text-sidebar-foreground lg:px-16">
        <span className="grid size-12 place-items-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          SM
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">SKILL MATRIX</h1>
        <p className="mt-2 text-sidebar-foreground/80">
          ระบบบริหารทักษะพนักงาน แผนก Production 1-LDI
        </p>
        <ul className="mt-10 space-y-5">
          {[
            { icon: BarChart3, title: "ภาพรวมทักษะทั้งแผนก", desc: "Dashboard สรุปกำลังคนและระดับทักษะ" },
            { icon: GraduationCap, title: "วางแผน Training ตรงจุด", desc: "รู้ทันทีว่าใครต้องพัฒนาทักษะใด" },
            { icon: ShieldCheck, title: "ระบุ Trainer ได้ทันที", desc: "ค้นหาผู้ที่สอนงานได้ในแต่ละทักษะ" },
          ].map((f) => (
            <li key={f.title} className="flex gap-3">
              <f.icon className="mt-0.5 size-5 text-sidebar-primary" />
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
          <h2 className="font-display text-xl font-semibold">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ใช้บัญชี Microsoft ขององค์กรเพื่อเข้าใช้งานระบบ
          </p>
          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={signIn}
            disabled={loading || checking}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "Login with Microsoft"}
          </Button>
          <p className="mt-6 text-xs text-muted-foreground">
            สำหรับหัวหน้าและผู้ช่วยหัวหน้า Production เท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}
