import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  Factory,
  ListChecks,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  Layers3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SKILL_LEVELS,
  buildGapRows,
  competencyName,
  useAssessments,
  useEmployees,
  useProductions,
  useSkills,
} from "@/lib/skill-matrix";

type StatTone = "primary" | "warning" | "destructive" | "success";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard ภาพรวมทักษะ | SKILL MATRIX" },
      {
        name: "description",
        content:
          "ภาพรวมจำนวนพนักงาน ระดับทักษะ Skill Gap Trainer และผู้ที่ควรได้รับ Training เพิ่ม",
      },
      { property: "og:title", content: "Dashboard ภาพรวมทักษะ | SKILL MATRIX" },
      {
        property: "og:description",
        content: "สรุปกำลังคนและทักษะของแผนก Production 1-LDI",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone?: StatTone;
}) {
  const toneClasses: Record<StatTone, string> = {
    primary: "from-sky-400 via-blue-500 to-indigo-500 shadow-sky-500/25",
    warning: "from-amber-300 via-orange-400 to-rose-400 shadow-orange-500/25",
    destructive: "from-rose-400 via-red-500 to-orange-500 shadow-rose-500/25",
    success: "from-emerald-300 via-teal-400 to-cyan-500 shadow-emerald-500/25",
  };
  const toneClass = toneClasses[tone];
  return (
    <div className="panel group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 opacity-70" />
      <div className="flex items-center gap-4">
        <span
          className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} text-white shadow-lg transition-transform group-hover:scale-105`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <div className="text-3xl font-semibold leading-tight tracking-tight text-slate-900">
            {value}
          </div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconClass = "from-sky-400 to-blue-600",
}: {
  icon: typeof Users;
  title: string;
  description?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${iconClass} text-white shadow-lg shadow-slate-900/10`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: assessments = [] } = useAssessments();

  const rows = buildGapRows(employees, skills, assessments);
  const gapRows = rows.filter((r) => r.gap > 0);
  const trainerIds = new Set(
    rows.filter((r) => r.assessment.current_level >= 4).map((r) => r.employee.id),
  );
  employees.filter((e) => e.competency_level === 5).forEach((e) => trainerIds.add(e.id));
  const trainingIds = new Set(
    rows.filter((r) => r.assessment.current_level <= 2).map((r) => r.employee.id),
  );

  const levelDist = SKILL_LEVELS.map((l) => {
    const count = rows.filter((r) => r.assessment.current_level === l.value).length;
    return {
      ...l,
      count,
      percent: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0,
    };
  });

  const perProduction = productions.map((p) => ({
    name: p.name.replace("Production ", "P."),
    code: p.code,
    full: p.name,
    count: employees.filter((e) => e.production_id === p.id).length,
  }));

  const productionColors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "oklch(0.69 0.17 205)",
  ];

  const urgentGaps = [...gapRows].sort((a, b) => b.gap - a.gap).slice(0, 10);

  const employeeSummary = employees.map((emp) => {
    const own = rows.filter((r) => r.employee.id === emp.id);
    return {
      emp,
      total: own.length,
      onPlan: own.filter((r) => r.assessment.current_level >= r.assessment.target_level).length,
      improve: own.filter((r) => r.assessment.current_level >= 4).length,
    };
  });

  const productionName = (id: string | null) => productions.find((p) => p.id === id)?.name ?? "-";

  return (
    <AppShell title="Dashboard" description="ภาพรวมพนักงานและทักษะของแผนก Production 1-LDI">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="พนักงานทั้งหมด (คน)" value={employees.length} />
        <StatCard icon={ListChecks} label="ทักษะทั้งหมด (รายการ)" value={skills.length} />
        <StatCard
          icon={AlertTriangle}
          label="รายการ Skill Gap"
          value={gapRows.length}
          tone="destructive"
        />
        <StatCard
          icon={GraduationCap}
          label="พนักงานที่ควร Training เพิ่ม (คน)"
          value={trainingIds.size}
          tone="warning"
        />
        <StatCard
          icon={UserCheck}
          label="พนักงานที่เป็น Trainer ได้ (คน)"
          value={trainerIds.size}
          tone="success"
        />
        <StatCard
          icon={Factory}
          label="จำนวน Production"
          value={productions.length}
          tone="primary"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <SectionHeader
            icon={Factory}
            title="จำนวนพนักงานแยกตาม Production"
            description="ภาพรวมกำลังคนแต่ละสายการผลิต"
            iconClass="from-amber-300 to-orange-500"
          />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perProduction}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [`${v} คน`, "จำนวน"]}
                  labelFormatter={(l: string) => perProduction.find((p) => p.name === l)?.full ?? l}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {perProduction.map((production, index) => (
                    <Cell
                      key={production.code}
                      fill={productionColors[index % productionColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <SectionHeader
            icon={Layers3}
            title="จำนวนพนักงานตามระดับทักษะ"
            description="นับทุกทักษะที่ประเมินแล้ว"
            iconClass="from-violet-400 to-fuchsia-500"
          />
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>ระดับ</TableHead>
                <TableHead>ความหมาย</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ร้อยละ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levelDist.map((l) => (
                <TableRow key={l.value}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            productionColors[(l.value - 1) % productionColors.length],
                        }}
                      />
                      {l.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.desc}</TableCell>
                  <TableCell className="text-right">{l.count}</TableCell>
                  <TableCell className="text-right">{l.percent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="panel mt-6 p-5">
        <SectionHeader
          icon={TrendingUp}
          title="ทักษะที่ต้องพัฒนาเร่งด่วน (Skill Gap)"
          description="จัดลำดับ gap สูงสุดเพื่อวางแผน training ก่อน"
          iconClass="from-rose-400 to-red-500"
        />
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Production</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ทักษะ</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">Target</TableHead>
                <TableHead className="text-center">Gap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urgentGaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ยังไม่มีข้อมูล Skill Gap
                  </TableCell>
                </TableRow>
              ) : (
                urgentGaps.map((r) => (
                  <TableRow key={r.assessment.id}>
                    <TableCell>{productionName(r.employee.production_id)}</TableCell>
                    <TableCell className="font-medium">{r.employee.full_name}</TableCell>
                    <TableCell>{r.skill.skill_name}</TableCell>
                    <TableCell className="text-center">{r.assessment.current_level}</TableCell>
                    <TableCell className="text-center">{r.assessment.target_level}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm shadow-rose-500/20">
                        {r.gap}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <SectionHeader
            icon={Sparkles}
            title="รายชื่อ Trainer"
            description="มีทักษะ Level 4 หรือระดับความสามารถ Master"
            iconClass="from-emerald-300 to-teal-500"
          />
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>Production</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees
                .filter((e) => trainerIds.has(e.id))
                .map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.position || "-"}</TableCell>
                    <TableCell>{productionName(e.production_id)}</TableCell>
                  </TableRow>
                ))}
              {trainerIds.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    ยังไม่มีข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        <section className="panel p-5">
          <SectionHeader
            icon={GraduationCap}
            title="ผู้ที่ควรได้รับ Training เพิ่ม"
            description="มีทักษะที่อยู่ใน Level 1 หรือ Level 2"
            iconClass="from-amber-300 to-yellow-500"
          />
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>Production</TableHead>
                <TableHead className="text-right">ทักษะที่ต้องพัฒนา</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees
                .filter((e) => trainingIds.has(e.id))
                .map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{productionName(e.production_id)}</TableCell>
                    <TableCell className="text-right">
                      {
                        rows.filter(
                          (r) => r.employee.id === e.id && r.assessment.current_level <= 2,
                        ).length
                      }
                    </TableCell>
                  </TableRow>
                ))}
              {trainingIds.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    ยังไม่มีข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="panel mt-6 p-5">
        <SectionHeader
          icon={ListChecks}
          title="ตารางทักษะ / ความสามารถที่ต้องการ"
          description="สรุปความครบถ้วนของแผนทักษะรายพนักงาน"
          iconClass="from-sky-400 to-indigo-500"
        />
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No.</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead className="text-center">ทักษะทั้งหมด</TableHead>
                <TableHead className="text-center">ตามแผนงาน</TableHead>
                <TableHead className="text-center">แก้ไขปัญหาปรับปรุง</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    ยังไม่มีข้อมูลพนักงาน
                  </TableCell>
                </TableRow>
              ) : (
                employeeSummary.map((s, i) => (
                  <TableRow key={s.emp.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {s.emp.full_name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {competencyName(s.emp.competency_level)}
                      </span>
                    </TableCell>
                    <TableCell>{s.emp.position || "-"}</TableCell>
                    <TableCell className="text-center">{s.total}</TableCell>
                    <TableCell className="text-center">{s.onPlan}</TableCell>
                    <TableCell className="text-center">{s.improve}</TableCell>
                    <TableCell className="text-muted-foreground">{s.emp.remark || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </AppShell>
  );
}
