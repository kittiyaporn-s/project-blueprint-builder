import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users,
  Factory,
  ListChecks,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  Layers3,
  Sparkles,
  Target,
  TrendingUp,
  Activity,
  BriefcaseBusiness,
  Hash,
  MessageSquareText,
  Gauge,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type StatTone = "primary" | "warning" | "destructive" | "success" | "violet";

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
  caption,
  tone = "primary",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  caption?: string;
  tone?: StatTone;
}) {
  const toneClasses: Record<StatTone, string> = {
    primary: "from-sky-400 via-blue-500 to-indigo-500 shadow-sky-500/25",
    warning: "from-amber-300 via-orange-400 to-rose-400 shadow-orange-500/25",
    destructive: "from-rose-400 via-red-500 to-orange-500 shadow-rose-500/25",
    success: "from-emerald-300 via-teal-400 to-cyan-500 shadow-emerald-500/25",
    violet: "from-violet-400 via-fuchsia-500 to-pink-500 shadow-fuchsia-500/25",
  };
  const toneClass = toneClasses[tone];
  return (
    <div className="panel group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10">
      <div
        className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${toneClass} opacity-15 blur-2xl transition-opacity group-hover:opacity-30`}
      />
      <div className="relative flex items-center gap-4">
        <span
          className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} text-white shadow-lg transition-transform group-hover:scale-105`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <div className="text-3xl font-bold leading-tight tracking-tight text-slate-950">
            {value}
          </div>
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          {caption ? <div className="mt-1 text-xs text-muted-foreground">{caption}</div> : null}
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

function IconHead({
  icon: Icon,
  children,
  align = "left",
}: {
  icon: typeof Users;
  children: ReactNode;
  align?: "left" | "center" | "right";
}) {
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";

  return <span className={`flex items-center gap-2 ${justify}`}><Icon className="size-4 text-sky-500" />{children}</span>;
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
  const assessedPercent = employees.length
    ? Math.round((new Set(rows.map((row) => row.employee.id)).size / employees.length) * 100)
    : 0;
  const gapPercent = rows.length ? Math.round((gapRows.length / rows.length) * 100) : 0;

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
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_28rem),radial-gradient(circle_at_top_right,rgba(217,70,239,0.28),transparent_24rem)]" />
        <div className="absolute -bottom-24 right-8 size-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Badge className="rounded-full border border-white/20 bg-white/10 text-white backdrop-blur">
              Skill Matrix Overview
            </Badge>
            <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
              <Activity className="size-8 text-cyan-300" />
              ภาพรวมทักษะการผลิตแบบเรียลไทม์
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
              ติดตามกำลังคน Skill Gap Trainer และแผนพัฒนาทักษะในหน้าเดียว พร้อมตัวเลขสรุปอ่านง่าย
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Activity className="size-4 text-cyan-300" />
                ประเมินแล้ว
              </div>
              <div className="mt-2 text-4xl font-bold">{assessedPercent}%</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Gauge className="size-4 text-rose-300" />
                Gap Ratio
              </div>
              <div className="mt-2 text-4xl font-bold">{gapPercent}%</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="พนักงานทั้งหมด"
          value={employees.length}
          caption="จำนวนคนในระบบ"
        />
        <StatCard
          icon={ListChecks}
          label="ทักษะทั้งหมด"
          value={skills.length}
          caption="รายการทักษะที่ใช้งาน"
          tone="violet"
        />
        <StatCard
          icon={AlertTriangle}
          label="รายการ Skill Gap"
          value={gapRows.length}
          caption="รายการต่ำกว่าเป้าหมาย"
          tone="destructive"
        />
        <StatCard
          icon={GraduationCap}
          label="ควร Training เพิ่ม"
          value={trainingIds.size}
          caption="พนักงาน Level 1-2"
          tone="warning"
        />
        <StatCard
          icon={UserCheck}
          label="Trainer พร้อมใช้"
          value={trainerIds.size}
          caption="Level 4 หรือ Master"
          tone="success"
        />
        <StatCard
          icon={Factory}
          label="Production"
          value={productions.length}
          caption="สายการผลิตทั้งหมด"
          tone="primary"
        />
      </div>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            icon={Users}
            title="สถานะผู้ใช้งานทุกคน"
            description="แสดงรูปผู้ใช้งาน สถานะ และ Production ของพนักงานทั้งหมด"
            iconClass="from-cyan-400 to-blue-600"
          />
          <Badge className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
            ออนไลน์ / ปฏิบัติงาน
          </Badge>
        </div>
        <div className="mt-5 grid max-h-[28rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {employees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              ยังไม่มีข้อมูลผู้ใช้งาน
            </div>
          ) : (
            employees.map((employee, index) => {
              const initials = employee.full_name.trim().slice(0, 2).toUpperCase() || "U";
              const isActive = employee.status !== "ลาออก";
              const avatarColor = productionColors[index % productionColors.length];

              return (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/75 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="relative shrink-0">
                    <Avatar className="size-12 border-2 border-white shadow-md">
                      <AvatarImage src="" alt={employee.full_name} />
                      <AvatarFallback
                        className="font-bold text-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${
                        isActive ? "bg-emerald-400" : "bg-slate-300"
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {employee.full_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {productionName(employee.production_id)} • {employee.position || "-"}
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {employee.status || "ปฏิบัติงาน"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <SectionHeader
            icon={Factory}
            title="จำนวนพนักงานแยกตาม Production"
            description="ภาพรวมกำลังคนแต่ละสายการผลิต"
            iconClass="from-amber-300 to-orange-500"
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: number, _name, item) => [`${value} คน`, item.payload.full]}
                  />
                  <Legend
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-xs font-medium text-slate-600">{value}</span>
                    )}
                  />
                  <Pie
                    data={perProduction}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={58}
                    outerRadius={96}
                    paddingAngle={4}
                    cornerRadius={10}
                  >
                    {perProduction.map((production, index) => (
                      <Cell
                        key={production.code}
                        fill={productionColors[index % productionColors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {perProduction.map((production, index) => (
                <div
                  key={production.code}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: productionColors[index % productionColors.length] }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{production.full}</p>
                      <p className="text-xs text-muted-foreground">{production.code}</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-slate-950">{production.count}</div>
                </div>
              ))}
            </div>
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
                <TableHead><IconHead icon={Gauge}>ระดับ</IconHead></TableHead>
                <TableHead><IconHead icon={Sparkles}>ความหมาย</IconHead></TableHead>
                <TableHead className="text-right"><IconHead icon={Users} align="right">จำนวน</IconHead></TableHead>
                <TableHead className="text-right"><IconHead icon={TrendingUp} align="right">ร้อยละ</IconHead></TableHead>
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
                <TableHead><IconHead icon={Factory}>Production</IconHead></TableHead>
                <TableHead><IconHead icon={Users}>ชื่อ-นามสกุล</IconHead></TableHead>
                <TableHead><IconHead icon={ListChecks}>ทักษะ</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={Gauge} align="center">Current</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={Target} align="center">Target</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={AlertTriangle} align="center">Gap</IconHead></TableHead>
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
                <TableHead><IconHead icon={Users}>ชื่อ-นามสกุล</IconHead></TableHead>
                <TableHead><IconHead icon={BriefcaseBusiness}>ตำแหน่ง</IconHead></TableHead>
                <TableHead><IconHead icon={Factory}>Production</IconHead></TableHead>
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
                <TableHead><IconHead icon={Users}>ชื่อ-นามสกุล</IconHead></TableHead>
                <TableHead><IconHead icon={Factory}>Production</IconHead></TableHead>
                <TableHead className="text-right"><IconHead icon={GraduationCap} align="right">ทักษะที่ต้องพัฒนา</IconHead></TableHead>
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
                <TableHead className="w-14"><IconHead icon={Hash}>No.</IconHead></TableHead>
                <TableHead><IconHead icon={Users}>ชื่อ-นามสกุล</IconHead></TableHead>
                <TableHead><IconHead icon={BriefcaseBusiness}>ตำแหน่ง</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={ListChecks} align="center">ทักษะทั้งหมด</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={Activity} align="center">ตามแผนงาน</IconHead></TableHead>
                <TableHead className="text-center"><IconHead icon={Sparkles} align="center">แก้ไขปัญหาปรับปรุง</IconHead></TableHead>
                <TableHead><IconHead icon={MessageSquareText}>หมายเหตุ</IconHead></TableHead>
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
