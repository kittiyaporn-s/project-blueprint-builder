import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Database,
  Factory,
  Gauge,
  GraduationCap,
  Home,
  Layers3,
  Lightbulb,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildGapRows, useAssessments, useEmployees, useProductions, useSkills } from "@/lib/skill-matrix";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  head: () => ({
    meta: [
      { title: "Skill Gap | SKILL MATRIX" },
      { name: "description", content: "วิเคราะห์ Skill Gap จากข้อมูลประเมินใน localStorage" },
    ],
  }),
  component: SkillGapPage,
});

type StatTone = "primary" | "warning" | "destructive" | "success";

function StatCard({ icon: Icon, label, value, tone = "primary" }: { icon: typeof Users; label: string; value: number | string; tone?: StatTone }) {
  const toneClasses: Record<StatTone, string> = {
    primary: "from-sky-400 via-blue-500 to-indigo-500 shadow-sky-500/25",
    warning: "from-amber-300 via-orange-400 to-rose-400 shadow-orange-500/25",
    destructive: "from-rose-400 via-red-500 to-orange-500 shadow-rose-500/25",
    success: "from-emerald-300 via-teal-400 to-cyan-500 shadow-emerald-500/25",
  };

  return (
    <div className="panel flex items-center justify-between gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <span className={`grid size-14 place-items-center rounded-3xl bg-gradient-to-br ${toneClasses[tone]} text-white shadow-lg`}><Icon className="size-7" /></span>
        <div><div className="font-display text-4xl font-bold leading-tight text-blue-950">{value}</div><div className="text-sm font-semibold text-slate-700">{label}</div></div>
      </div>
      <span className={tone === "destructive" ? "text-xs font-bold text-rose-600" : "text-xs font-bold text-emerald-600"}>▲ +4</span>
    </div>
  );
}

function IconHead({ icon: Icon, children, align = "left" }: { icon: typeof Users; children: ReactNode; align?: "left" | "center" | "right" }) {
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";
  return <span className={`flex items-center gap-2 ${justify}`}><Icon className="size-4 text-sky-500" />{children}</span>;
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
      return { id: skill.id, name: skill.skill_name, category: skill.skill_category, count: skillRows.length, totalGap: skillRows.reduce((total, row) => total + row.gap, 0) };
    })
    .filter((skill) => skill.count > 0)
    .sort((a, b) => b.totalGap - a.totalGap);
  const gapByEmployee = employees
    .map((employee) => {
      const employeeRows = gapRows.filter((row) => row.employee.id === employee.id);
      return { id: employee.id, name: employee.full_name, position: employee.position, production: productionName(employee.production_id), count: employeeRows.length, totalGap: employeeRows.reduce((total, row) => total + row.gap, 0) };
    })
    .filter((employee) => employee.count > 0)
    .sort((a, b) => b.totalGap - a.totalGap);
  const readinessScore = completionRate;
  const criticalGapCount = gapBySkill.filter((skill) => skill.totalGap >= 3).length;
  const improvementPlans = [
    { title: "พัฒนาทักษะดิจิทัล (Digital Skills Training)", desc: "หลักสูตรด้าน Digital Literacy, Data Analysis, AI Tools", count: trainingEmployeeIds.size },
    { title: "โครงการพี่เลี้ยง (Mentoring Program)", desc: "จับคู่พนักงานกับผู้เชี่ยวชาญในสายงาน", count: Math.max(1, Math.round(trainingEmployeeIds.size / 2)) },
    { title: "เวิร์กช็อปเชิงปฏิบัติการ (Workshop)", desc: "พัฒนาทักษะผ่านการเรียนรู้แบบลงมือทำ", count: Math.max(1, gapBySkill.length) },
    { title: "การเรียนรู้ออนไลน์ (e-Learning)", desc: "หลักสูตรตามสมรรถนะ เรียนได้ทุกที่ทุกเวลา", count: trainingEmployeeIds.size },
  ];

  return (
    <AppShell title="Gap Analysis" description="วิเคราะห์ช่องว่างสมรรถนะ เพื่อระบุประเด็นการพัฒนา">
      {rows.length === 0 ? (
        <section className="panel mb-6 flex flex-wrap items-start justify-between gap-3 p-5">
          <div className="flex items-start gap-3 text-amber-900"><span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-600"><AlertCircle className="size-5" /></span><div><h2 className="font-display text-xl font-semibold text-slate-900">ยังไม่มีข้อมูลประเมิน</h2><p className="text-sm text-muted-foreground">ไปที่หน้า “ประเมินทักษะ” เพื่อบันทึกผลก่อนดู Skill Gap</p></div></div>
          <Button asChild className="bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20"><Link to="/assessment">ไปประเมินทักษะ</Link></Button>
        </section>
      ) : null}

      <section className="panel overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"><TrendingUp className="size-9" /></span><div><h1 className="font-display text-3xl font-bold text-blue-950">Gap Analysis</h1><p className="text-sm font-semibold text-slate-600">วิเคราะห์ช่องว่างสมรรถนะ เพื่อระบุประเด็นการพัฒนา</p><p className="text-xs text-muted-foreground">Identify Gaps and Prioritize Development</p></div></div>
          <div className="flex flex-wrap gap-3"><Select defaultValue="2568"><SelectTrigger className="w-[190px] bg-white/90 font-semibold text-blue-950"><CalendarDays className="mr-2 size-4 text-blue-500" /><SelectValue /></SelectTrigger><SelectContent>{[2568, 2569, 2570, 2571, 2572].map((year) => <SelectItem key={year} value={String(year)}>ปีงบประมาณ {year}</SelectItem>)}</SelectContent></Select><Button className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20"><Plus className="mr-2 size-4" />สร้างการวิเคราะห์ใหม่</Button></div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="สมรรถนะที่ประเมิน" value={rows.length} />
        <StatCard icon={AlertCircle} label="ช่องว่างสำคัญ" value={criticalGapCount} tone="destructive" />
        <StatCard icon={Users} label="พนักงานที่ต้องพัฒนา" value={trainingEmployeeIds.size} tone="warning" />
        <StatCard icon={Gauge} label="คะแนนความพร้อมรวม" value={`${readinessScore}%`} tone="success" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr_0.85fr]">
        <div className="panel p-5"><h2 className="font-display text-xl font-bold text-blue-950">เปรียบเทียบระดับสมรรถนะ (Required vs Actual)</h2><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={gapBySkill.slice(0, 6).map((skill) => ({ name: skill.name.slice(0, 16), required: 80, actual: Math.max(30, 80 - skill.totalGap * 6) }))}><CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="required" fill="#2563eb" radius={[8, 8, 0, 0]} /><Bar dataKey="actual" fill="#67d4f4" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-blue-950">Top 5 ช่องว่างที่สำคัญ</h2><Button variant="link">ดูทั้งหมด</Button></div><Table className="mt-3"><TableHeader><TableRow><TableHead>#</TableHead><TableHead>สมรรถนะ</TableHead><TableHead className="text-center">ช่องว่าง</TableHead></TableRow></TableHeader><TableBody>{gapBySkill.slice(0, 5).map((skill, index) => <TableRow key={skill.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{skill.name}</TableCell><TableCell className="text-center"><Badge className="rounded-full bg-rose-100 text-rose-700">{skill.totalGap}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="panel p-5"><h2 className="font-display text-xl font-bold text-blue-950">การจัดลำดับความสำคัญของการพัฒนา</h2><div className="mt-4 grid h-72 grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl border border-blue-100 text-xs font-semibold"><div className="bg-emerald-50 p-3 text-emerald-700">พัฒนาต่อเนื่อง<br />Leadership</div><div className="bg-rose-50 p-3 text-rose-700">เร่งด่วน<br />{gapBySkill[0]?.name ?? "Digital Literacy"}</div><div className="bg-sky-50 p-3 text-sky-700">เฝ้าติดตาม<br />Customer Focus</div><div className="bg-amber-50 p-3 text-amber-700">วางแผนพัฒนา<br />{gapBySkill[1]?.name ?? "Innovation"}</div></div></div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-blue-950">ข้อเสนอแนะแนวทางการพัฒนา</h2><Button variant="link">ดูทั้งหมด</Button></div><div className="mt-4 space-y-3">{improvementPlans.map((plan, index) => <div key={plan.title} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-sm"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">{index === 0 ? <GraduationCap className="size-5" /> : index === 1 ? <Users className="size-5" /> : index === 2 ? <BarChart3 className="size-5" /> : <Gauge className="size-5" />}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-blue-950">{plan.title}</p><p className="truncate text-xs text-muted-foreground">{plan.desc}</p></div><span className="font-bold text-blue-700">{plan.count} คน</span></div>)}</div></div>
        <div className="panel overflow-hidden p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-bold text-blue-950">รายชื่อกลุ่มเป้าหมายที่ต้องพัฒนา</h2><div className="flex flex-wrap gap-2"><Select defaultValue="all"><SelectTrigger className="w-[140px] bg-white/90"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทั้งหมด</SelectItem></SelectContent></Select><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input placeholder="ค้นหาชื่อพนักงาน..." className="w-[220px] bg-white/90 pl-9" /></div><Button variant="link">ดูทั้งหมด</Button></div></div><div className="mt-4 overflow-x-auto rounded-2xl border border-blue-100 bg-white/90"><Table><TableHeader><TableRow className="bg-blue-50/80"><TableHead>#</TableHead><TableHead>ชื่อ-สกุล</TableHead><TableHead>ตำแหน่ง</TableHead><TableHead>หน่วยงาน</TableHead><TableHead>สมรรถนะหลักที่มีช่องว่าง</TableHead><TableHead className="text-center">ระดับช่องว่าง</TableHead><TableHead>แผนการพัฒนา</TableHead><TableHead>สถานะ</TableHead></TableRow></TableHeader><TableBody>{gapByEmployee.slice(0, 6).map((employee, index) => <TableRow key={employee.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{employee.name}</TableCell><TableCell>{employee.position || "-"}</TableCell><TableCell>{employee.production}</TableCell><TableCell>{gapRows.filter((row) => row.employee.id === employee.id).slice(0, 2).map((row) => row.skill.skill_name).join(", ")}</TableCell><TableCell className="text-center"><Badge className="rounded-full bg-rose-100 text-rose-700">{employee.totalGap}</Badge></TableCell><TableCell>{improvementPlans[index % improvementPlans.length]?.title.split(" (")[0]}</TableCell><TableCell><Badge className="rounded-full bg-amber-100 text-amber-700">รอดำเนินการ</Badge></TableCell></TableRow>)}</TableBody></Table></div></div>
      </section>
    </AppShell>
  );
}

