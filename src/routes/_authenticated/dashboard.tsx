import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
  Target,
  TrendingUp,
  Activity,
  BriefcaseBusiness,
  Hash,
  MessageSquareText,
  Gauge,
  Search,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  SKILL_LEVELS,
  buildGapRows,
  competencyName,
  useAssessments,
  useEmployees,
  useProductions,
  useSkills,
} from "@/lib/skill-matrix";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "warning" | "destructive" | "success" | "violet";

const ALL_FILTER = "all";
const MATRIX_COLORS: Record<number, string> = {
  1: "bg-slate-200 text-slate-700",
  2: "bg-orange-200 text-orange-800",
  3: "bg-yellow-200 text-yellow-800",
  4: "bg-sky-200 text-sky-800",
  5: "bg-emerald-200 text-emerald-800",
};

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
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
          <Icon className="size-4 text-sky-500" />
          {title}
        </h2>
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

  return (
    <span className={`flex items-center gap-2 ${justify}`}>
      <Icon className="size-4 text-sky-500" />
      {children}
    </span>
  );
}

function DashboardPage() {
  const [productionFilter, setProductionFilter] = useState(ALL_FILTER);
  const [levelFilter, setLevelFilter] = useState(ALL_FILTER);
  const [searchText, setSearchText] = useState("");
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: assessments = [] } = useAssessments();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

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

  const productionSkillAverages = productions.map((production) => {
    const productionEmployees = employees.filter(
      (employee) => employee.production_id === production.id,
    );
    const productionEmployeeIds = new Set(productionEmployees.map((employee) => employee.id));
    const productionRows = rows.filter((row) => productionEmployeeIds.has(row.employee.id));
    const averageLevel = productionRows.length
      ? Math.round(
          (productionRows.reduce((total, row) => total + row.assessment.current_level, 0) /
            productionRows.length) *
            10,
        ) / 10
      : 0;
    const goodSkillCount = productionRows.filter((row) => row.assessment.current_level >= 4).length;
    const improvementCount = productionRows.filter((row) => row.gap > 0).length;
    const status =
      averageLevel >= 3.5 ? "ทักษะดี" : averageLevel >= 2.5 ? "ควรติดตาม" : "ต้องปรับปรุง";

    return {
      id: production.id,
      code: production.code,
      name: production.name,
      employeeCount: productionEmployees.length,
      assessmentCount: productionRows.length,
      averageLevel,
      goodSkillCount,
      improvementCount,
      status,
    };
  });

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
  const matrixSkills = skills.slice(0, 9);
  const matrixEmployees = employees
    .filter(
      (employee) => productionFilter === ALL_FILTER || employee.production_id === productionFilter,
    )
    .filter((employee) => {
      const keyword = searchText.trim().toLowerCase();
      if (!keyword) return true;
      return [employee.full_name, employee.position, productionName(employee.production_id)]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    })
    .sort((firstEmployee, secondEmployee) => {
      const productionCompare = productionName(firstEmployee.production_id).localeCompare(
        productionName(secondEmployee.production_id),
        "th",
      );
      if (productionCompare !== 0) return productionCompare;
      return firstEmployee.full_name.localeCompare(secondEmployee.full_name, "th");
    });
  const matrixRows = matrixEmployees
    .map((employee) => {
      const skillLevels = matrixSkills.map((skill) => {
        const assessment = rows.find(
          (row) => row.employee.id === employee.id && row.skill.id === skill.id,
        )?.assessment;
        return assessment?.current_level ?? 0;
      });
      const visibleLevels =
        levelFilter === ALL_FILTER
          ? skillLevels
          : skillLevels.filter((level) => level === Number(levelFilter));
      const average = skillLevels.length
        ? (skillLevels.reduce((total, level) => total + level, 0) / skillLevels.length).toFixed(1)
        : "0.0";

      return { employee, skillLevels, visibleLevels, average };
    })
    .filter((row) => levelFilter === ALL_FILTER || row.visibleLevels.length > 0);

  function resetFilters() {
    setProductionFilter(ALL_FILTER);
    setLevelFilter(ALL_FILTER);
    setSearchText("");
  }

  return (
    <AppShell title="Dashboard" description="ภาพรวมพนักงานและทักษะของแผนก Production 1-LDI">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 text-slate-950 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24rem),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_24rem)]" />
        <div className="absolute right-0 top-0 h-40 w-1/2 rounded-bl-[6rem] bg-gradient-to-br from-blue-100 via-sky-100 to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h1 className="flex items-center gap-3 font-display text-4xl font-bold tracking-tight text-blue-950 md:text-5xl">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <Users className="size-7" />
              </span>
              Skill Matrix
            </h1>
            <p className="mt-2 max-w-2xl text-lg font-semibold text-slate-700">
              การจัดการทักษะและความชำนาญของบุคลากร
            </p>
            <p className="text-sm text-slate-500">Skills Management and Proficiency Matrix</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-950">
              พัฒนาคน พัฒนาองค์กร สู่การเติบโตอย่างยั่งยืน
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Develop People | Empower Organization | Drive Sustainable Growth
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Select value={productionFilter} onValueChange={setProductionFilter}>
            <SelectTrigger className="bg-white/90">
              <SelectValue placeholder="หน่วยงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>หน่วยงานทั้งหมด</SelectItem>
              {productions.map((production) => (
                <SelectItem key={production.id} value={production.id}>
                  {production.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="bg-white/90">
              <SelectValue placeholder="ระดับความชำนาญ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>ระดับทั้งหมด</SelectItem>
              {[1, 2, 3, 4, 5].map((level) => (
                <SelectItem key={level} value={String(level)}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="ค้นหาพนักงาน ตำแหน่ง หรือทักษะ..."
              className="bg-white/90 pl-9"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
            <Search className="mr-2 size-4" />
            ค้นหา
          </Button>
          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 size-4" />
            รีเซ็ต
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="จำนวนทักษะทั้งหมด"
          value={skills.length}
          caption="จากเดือนที่ผ่านมา +6"
        />
        <StatCard
          icon={Users}
          label="พนักงานที่มีทักษะ"
          value={new Set(rows.map((row) => row.employee.id)).size}
          caption="จากเดือนที่ผ่านมา +12"
        />
        <StatCard
          icon={Gauge}
          label="ความครอบคลุมทักษะ"
          value={`${assessedPercent}%`}
          caption="จากเดือนที่ผ่านมา +8%"
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="ช่องว่างทักษะหลัก"
          value={gapRows.length}
          caption="ต้องเร่งพัฒนา"
          tone="destructive"
        />
      </div>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            icon={Users}
            title="ตาราง Skill Matrix รายบุคลากร"
            description="แสดงระดับความชำนาญของพนักงานในแต่ละทักษะ (Skill Proficiency Level)"
            iconClass="from-blue-500 to-cyan-500"
          />
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {[
              [5, "เชี่ยวชาญ"],
              [4, "ชำนาญ"],
              [3, "พอใช้"],
              [2, "ต้องพัฒนา"],
              [1, "ไม่มีทักษะ"],
            ].map(([level, label]) => (
              <span
                key={level}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 shadow-sm"
              >
                <span className={cn("size-2.5 rounded-full", MATRIX_COLORS[level as number])} />
                {label} ({level})
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 max-h-[380px] overflow-auto rounded-2xl border border-blue-100 bg-white/90">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-blue-50">
                <TableHead className="w-14 text-center">ลำดับ</TableHead>
                <TableHead className="min-w-56">ชื่อ - สกุล</TableHead>
                <TableHead className="min-w-44">ตำแหน่ง</TableHead>
                <TableHead className="min-w-36">หน่วยงาน</TableHead>
                {matrixSkills.map((skill) => (
                  <TableHead key={skill.id} className="min-w-28 text-center text-xs">
                    {skill.skill_name}
                  </TableHead>
                ))}
                <TableHead className="text-center">คะแนนรวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={matrixSkills.length + 5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ยังไม่มีข้อมูลตามตัวกรอง
                  </TableCell>
                </TableRow>
              ) : (
                matrixRows.map((row, index) => (
                  <TableRow key={row.employee.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 border border-white shadow-sm">
                          <AvatarImage
                            src={row.employee.photo_url || ""}
                            alt={row.employee.full_name}
                          />
                          <AvatarFallback className="bg-blue-100 text-xs font-bold text-blue-700">
                            {row.employee.full_name.trim().slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {row.employee.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{row.employee.position || "-"}</TableCell>
                    <TableCell>{productionName(row.employee.production_id)}</TableCell>
                    {row.skillLevels.map((level, skillIndex) => (
                      <TableCell
                        key={`${row.employee.id}-${matrixSkills[skillIndex]?.id}`}
                        className="text-center"
                      >
                        <span
                          className={cn(
                            "inline-flex min-w-14 justify-center rounded-lg px-3 py-1 font-bold",
                            MATRIX_COLORS[level] ?? MATRIX_COLORS[0],
                          )}
                        >
                          {level}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-lg font-bold text-blue-950">
                      {row.average}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="panel mt-6 p-5">
        <SectionHeader
          icon={Factory}
          title="สรุปทักษะเฉลี่ยตาม Production"
          description="ดูว่าแผนกผลิตไหนมีทักษะเฉลี่ยดี และแผนกไหนควรวางแผนพัฒนาเพิ่ม"
          iconClass="from-emerald-400 to-cyan-500"
        />
        <div className="mt-4 overflow-x-auto rounded-2xl border border-blue-100 bg-white/90">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/80">
                <TableHead>
                  <IconHead icon={Factory}>Production</IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Users} align="center">
                    พนักงาน
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Gauge} align="center">
                    Level เฉลี่ย
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={TrendingUp} align="center">
                    ทักษะดี
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={AlertTriangle} align="center">
                    ต้องปรับปรุง
                  </IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Target}>สถานะ</IconHead>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionSkillAverages.map((production) => (
                <TableRow key={production.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{production.name}</div>
                    <div className="text-xs text-muted-foreground">{production.code}</div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {production.employeeCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="rounded-full bg-blue-100 text-blue-700">
                      Level {production.averageLevel.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-emerald-700">
                    {production.goodSkillCount}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-rose-700">
                    {production.improvementCount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        production.status === "ทักษะดี"
                          ? "rounded-full bg-emerald-100 text-emerald-700"
                          : production.status === "ควรติดตาม"
                            ? "rounded-full bg-amber-100 text-amber-700"
                            : "rounded-full bg-rose-100 text-rose-700"
                      }
                    >
                      {production.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {production.assessmentCount} รายการประเมิน
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <TableHead>
                  <IconHead icon={Gauge}>ระดับ</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Sparkles}>ความหมาย</IconHead>
                </TableHead>
                <TableHead className="text-right">
                  <IconHead icon={Users} align="right">
                    จำนวน
                  </IconHead>
                </TableHead>
                <TableHead className="text-right">
                  <IconHead icon={TrendingUp} align="right">
                    ร้อยละ
                  </IconHead>
                </TableHead>
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
                <TableHead>
                  <IconHead icon={Factory}>Production</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Users}>ชื่อ-นามสกุล</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={ListChecks}>ทักษะ</IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Gauge} align="center">
                    Current
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Target} align="center">
                    Target
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={AlertTriangle} align="center">
                    Gap
                  </IconHead>
                </TableHead>
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
                <TableHead>
                  <IconHead icon={Users}>ชื่อ-นามสกุล</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={BriefcaseBusiness}>ตำแหน่ง</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Factory}>Production</IconHead>
                </TableHead>
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
                <TableHead>
                  <IconHead icon={Users}>ชื่อ-นามสกุล</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Factory}>Production</IconHead>
                </TableHead>
                <TableHead className="text-right">
                  <IconHead icon={GraduationCap} align="right">
                    ทักษะที่ต้องพัฒนา
                  </IconHead>
                </TableHead>
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
                <TableHead className="w-14">
                  <IconHead icon={Hash}>No.</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Users}>ชื่อ-นามสกุล</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={BriefcaseBusiness}>ตำแหน่ง</IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={ListChecks} align="center">
                    ทักษะทั้งหมด
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Activity} align="center">
                    ตามแผนงาน
                  </IconHead>
                </TableHead>
                <TableHead className="text-center">
                  <IconHead icon={Sparkles} align="center">
                    แก้ไขปัญหาปรับปรุง
                  </IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={MessageSquareText}>หมายเหตุ</IconHead>
                </TableHead>
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
