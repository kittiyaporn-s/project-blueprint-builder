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
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, BarChart3, GraduationCap, Target, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildGapRows,
  useAssessments,
  useEmployees,
  useProductions,
  useSkills,
} from "@/lib/skill-matrix";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  head: () => ({
    meta: [
      { title: "Skill Gap | SKILL MATRIX" },
      {
        name: "description",
        content: "วิเคราะห์ Skill Gap จากข้อมูลประเมินใน localStorage",
      },
    ],
  }),
  component: SkillGapPage,
});

type StatTone = "primary" | "warning" | "destructive" | "success";

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

  return (
    <div className="panel group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 opacity-70" />
      <div className="flex items-center gap-4">
        <span
          className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClasses[tone]} text-white shadow-lg transition-transform group-hover:scale-105`}
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

function SkillGapPage() {
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: assessments = [] } = useAssessments();

  const rows = buildGapRows(employees, skills, assessments);
  const gapRows = rows.filter((row) => row.gap > 0).sort((a, b) => b.gap - a.gap);
  const trainingEmployeeIds = new Set(gapRows.map((row) => row.employee.id));
  const completedRows = rows.filter((row) => row.gap <= 0);
  const completionRate = rows.length ? Math.round((completedRows.length / rows.length) * 100) : 0;

  const productionName = (id: string | null) => productions.find((p) => p.id === id)?.name ?? "-";

  const gapBySkill = skills
    .map((skill) => {
      const skillRows = gapRows.filter((row) => row.skill.id === skill.id);
      return {
        id: skill.id,
        name: skill.skill_name,
        code: skill.skill_code ?? "-",
        category: skill.skill_category,
        count: skillRows.length,
        totalGap: skillRows.reduce((total, row) => total + row.gap, 0),
      };
    })
    .filter((skill) => skill.count > 0)
    .sort((a, b) => b.totalGap - a.totalGap)
    .slice(0, 10);

  const gapByEmployee = employees
    .map((employee) => {
      const employeeRows = gapRows.filter((row) => row.employee.id === employee.id);
      return {
        id: employee.id,
        name: employee.full_name,
        position: employee.position,
        production: productionName(employee.production_id),
        count: employeeRows.length,
        totalGap: employeeRows.reduce((total, row) => total + row.gap, 0),
      };
    })
    .filter((employee) => employee.count > 0)
    .sort((a, b) => b.totalGap - a.totalGap)
    .slice(0, 10);

  const chartColors = [
    "var(--color-chart-4)",
    "var(--color-chart-3)",
    "var(--color-chart-5)",
    "var(--color-chart-1)",
    "var(--color-chart-2)",
  ];

  return (
    <AppShell
      title="Skill Gap"
      description="วิเคราะห์ช่องว่างทักษะและแผน Training จาก localStorage"
    >
      {rows.length === 0 ? (
        <section className="panel mb-6 flex flex-wrap items-start justify-between gap-3 p-5">
          <div className="flex items-start gap-3 text-amber-900">
            <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-600">
              <AlertCircle className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                ยังไม่มีข้อมูลประเมิน
              </h2>
              <p className="text-sm text-muted-foreground">
                ไปที่หน้า “ประเมินทักษะ” เพื่อบันทึกผลก่อนดู Skill Gap
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20"
          >
            <Link to="/assessment">ไปประเมินทักษะ</Link>
          </Button>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} label="ผลประเมินทั้งหมด" value={rows.length} />
        <StatCard
          icon={TrendingUp}
          label="รายการ Skill Gap"
          value={gapRows.length}
          tone="destructive"
        />
        <StatCard
          icon={GraduationCap}
          label="พนักงานต้อง Training"
          value={trainingEmployeeIds.size}
          tone="warning"
        />
        <StatCard icon={Target} label="ผ่านเป้าหมาย" value={`${completionRate}%`} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-lg shadow-rose-500/20">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Gap สูงสุดตามทักษะ
              </h2>
              <p className="text-sm text-muted-foreground">
                จัดลำดับทักษะที่ต้องเร่งพัฒนามากที่สุด
              </p>
            </div>
          </div>
          {gapBySkill.length === 0 ? (
            <div className="mt-5 grid h-72 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/50 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูล gap สำหรับแสดงกราฟ
            </div>
          ) : (
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapBySkill} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="code" width={44} fontSize={12} />
                  <Tooltip formatter={(value: number) => [`${value} gap`, "รวม Gap"]} />
                  <Bar dataKey="totalGap" radius={[0, 10, 10, 0]}>
                    {gapBySkill.map((skill, index) => (
                      <Cell key={skill.id} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/20">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                พนักงานที่ควร Training ก่อน
              </h2>
              <p className="text-sm text-muted-foreground">เรียงตามคะแนน gap รวมสูงสุด</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead className="text-right">จำนวน Gap</TableHead>
                  <TableHead className="text-right">Gap รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gapByEmployee.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      ยังไม่มีพนักงานที่มี Skill Gap
                    </TableCell>
                  </TableRow>
                ) : (
                  gapByEmployee.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {employee.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {employee.position || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{employee.production}</TableCell>
                      <TableCell className="text-right">{employee.count}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                          {employee.totalGap}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Target className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                รายการ Skill Gap ทั้งหมด
              </h2>
              <p className="text-sm text-muted-foreground">
                แสดงเฉพาะรายการที่ Current ต่ำกว่า Target
              </p>
            </div>
          </div>
          <Badge className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
            {gapRows.length} รายการ
          </Badge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Production</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ทักษะ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">Target</TableHead>
                <TableHead className="text-center">Gap</TableHead>
                <TableHead>วันที่ประเมิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gapRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    ยังไม่มี Skill Gap ทุกผลประเมินผ่านเป้าหมายแล้ว
                  </TableCell>
                </TableRow>
              ) : (
                gapRows.map((row) => (
                  <TableRow key={row.assessment.id}>
                    <TableCell>{productionName(row.employee.production_id)}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {row.employee.full_name}
                    </TableCell>
                    <TableCell>{row.skill.skill_name}</TableCell>
                    <TableCell>{row.skill.skill_category}</TableCell>
                    <TableCell className="text-center">{row.assessment.current_level}</TableCell>
                    <TableCell className="text-center">{row.assessment.target_level}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                        {row.gap}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.assessment.assessment_date}</TableCell>
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
