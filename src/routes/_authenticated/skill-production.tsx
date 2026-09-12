import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Box,
  CheckCircle2,
  Factory,
  Hash,
  Layers3,
  Monitor,
  MoreHorizontal,
  PackageOpen,
  Plus,
  Search,
  Settings2,
  Tag,
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
import { Textarea } from "@/components/ui/textarea";
import {
  type Production,
  type Skill,
  useEmployees,
  useProductions,
  useSkills,
} from "@/lib/skill-matrix";
import {
  getLocalProductions,
  getLocalSkills,
  saveLocalProductions,
  saveLocalSkills,
} from "@/lib/skill-matrix-storage";

export const Route = createFileRoute("/_authenticated/skill-production")({
  head: () => ({
    meta: [
      { title: "Skill Production | SKILL MATRIX" },
      { name: "description", content: "จัดการ Production และรายการทักษะด้วย localStorage" },
    ],
  }),
  component: SkillProductionPage,
});

type ProductionForm = { code: string; name: string; product_types: string };
type SkillForm = { skill_code: string; skill_name: string; skill_category: string };

const ALL_CATEGORIES = "all-categories";
const EMPTY_PRODUCTION_FORM: ProductionForm = { code: "", name: "", product_types: "" };
const EMPTY_SKILL_FORM: SkillForm = { skill_code: "", skill_name: "", skill_category: "ทั่วไป" };
const LEVELS = [
  [1, "พื้นฐาน", "เข้าใจหลักการพื้นฐานและใช้เครื่องมือเบื้องต้นได้"],
  [2, "เริ่มปฏิบัติได้", "รวบรวมและจัดการข้อมูลตามมาตรฐานได้"],
  [3, "ปฏิบัติได้ด้วยตนเอง", "วิเคราะห์และนำเสนอข้อมูลเพื่อสนับสนุนงานได้"],
  [4, "ชำนาญ", "วิเคราะห์เชิงลึกและให้ข้อเสนอแนะต่อธุรกิจได้"],
  [5, "เชี่ยวชาญ", "ออกแบบกระบวนการและขับเคลื่อนการใช้ข้อมูลได้"],
] as const;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function IconHead({
  icon: Icon,
  children,
  align = "left",
}: {
  icon: typeof Factory;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <span className={`flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
      <Icon className="size-4 text-sky-500" />
      {children}
    </span>
  );
}

function SkillProductionPage() {
  const queryClient = useQueryClient();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: employees = [] } = useEmployees();
  const [productionForm, setProductionForm] = useState<ProductionForm>(EMPTY_PRODUCTION_FORM);
  const [skillForm, setSkillForm] = useState<SkillForm>(EMPTY_SKILL_FORM);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [skillSearch, setSkillSearch] = useState("");
  const [productionError, setProductionError] = useState("");
  const [skillError, setSkillError] = useState("");

  const skillCategories = useMemo(
    () =>
      [...new Set(skills.map((skill) => skill.skill_category))].sort((a, b) =>
        a.localeCompare(b, "th"),
      ),
    [skills],
  );
  const skillCategoryOptions = useMemo(
    () => [
      ...new Set([
        ...skillCategories,
        "พื้นฐาน",
        "เครื่องจักร",
        "ผสม",
        "บรรจุ",
        "QC",
        "Support",
        "ทั่วไป",
      ]),
    ],
    [skillCategories],
  );
  const displayCategories = skillCategories;
  const activeSkills = skills.filter((skill) => skill.active_status);
  const selectedSkill =
    skills.find((skill) => skill.skill_category === selectedCategory) ?? skills[0] ?? null;
  const catalogSkills = skills
    .filter(
      (skill) => selectedCategory === ALL_CATEGORIES || skill.skill_category === selectedCategory,
    )
    .filter((skill) => {
      const keyword = skillSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [skill.skill_code, skill.skill_name, skill.skill_category]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  const categoryCount = (category: string) =>
    skills.filter((skill) => skill.skill_category === category).length;

  function updateProductionForm(key: keyof ProductionForm, value: string) {
    setProductionForm((current) => ({ ...current, [key]: value }));
    setProductionError("");
  }

  function updateSkillForm(key: keyof SkillForm, value: string) {
    setSkillForm((current) => ({ ...current, [key]: value }));
    setSkillError("");
  }

  async function addProduction() {
    const code = productionForm.code.trim();
    const name = productionForm.name.trim();
    if (!code || !name) {
      setProductionError("กรุณากรอกรหัสและชื่อ Production");
      return;
    }
    if (productions.some((production) => production.code.toLowerCase() === code.toLowerCase())) {
      setProductionError("รหัส Production นี้มีอยู่แล้ว");
      return;
    }
    const nextProduction: Production = {
      id: createId("production"),
      code,
      name,
      product_types: productionForm.product_types.trim() || null,
      sort_order: productions.length + 1,
    };
    saveLocalProductions([...getLocalProductions(), nextProduction]);
    await queryClient.invalidateQueries({ queryKey: ["productions"] });
    setProductionForm(EMPTY_PRODUCTION_FORM);
  }

  async function addSkill() {
    const skillName = skillForm.skill_name.trim();
    if (!skillName) {
      setSkillError("กรุณากรอกชื่อทักษะ");
      return;
    }
    const skillCode = skillForm.skill_code.trim();
    if (
      skillCode &&
      skills.some((skill) => skill.skill_code?.toLowerCase() === skillCode.toLowerCase())
    ) {
      setSkillError("รหัสทักษะนี้มีอยู่แล้ว");
      return;
    }
    const nextSkill: Skill = {
      id: createId("skill"),
      skill_code: skillCode || null,
      skill_name: skillName,
      skill_category: skillForm.skill_category.trim() || "ทั่วไป",
      active_status: true,
      sort_order: skills.length + 1,
    };
    saveLocalSkills([...getLocalSkills(), nextSkill]);
    await queryClient.invalidateQueries({ queryKey: ["skills"] });
    setSkillForm(EMPTY_SKILL_FORM);
  }

  return (
    <AppShell
      title="Skill Production"
      description="Skill Library เชื่อมโยงทักษะกับงาน การเรียนรู้ และการเติบโต"
    >
      <section className="grid gap-4 xl:grid-cols-[1.1fr_repeat(4,0.9fr)]">
        <div className="panel flex items-center justify-between gap-4 p-5 xl:col-span-1">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <Layers3 className="size-8" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-blue-950">
                <Layers3 className="size-7 text-blue-600" />
                Skill Library
              </h1>
              <p className="text-sm font-medium text-slate-600">คลังทักษะเพื่อการพัฒนาศักยภาพ</p>
              <p className="text-xs text-muted-foreground">
                Link Skills to Work, Learning, and Growth
              </p>
            </div>
          </div>
          <Button
            onClick={addSkill}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20"
          >
            <Plus className="mr-2 size-4" />
            เพิ่มทักษะ
          </Button>
        </div>
        {[
          {
            icon: Box,
            label: "หมวดหมู่ทักษะ",
            value: displayCategories.length,
            caption: "หมวดหมู่",
            tone: "from-sky-400 to-blue-600",
          },
          {
            icon: PackageOpen,
            label: "ทักษะทั้งหมด",
            value: skills.length,
            caption: "ทักษะ",
            tone: "from-violet-400 to-indigo-600",
          },
          {
            icon: BarChart3,
            label: "ระดับความเชี่ยวชาญ",
            value: 5,
            caption: "ระดับ",
            tone: "from-amber-300 to-orange-500",
          },
          {
            icon: CheckCircle2,
            label: "ทักษะที่ใช้งาน",
            value: activeSkills.length,
            caption: "ทักษะ",
            tone: "from-emerald-300 to-teal-500",
          },
        ].map((card) => (
          <div key={card.label} className="panel flex items-center gap-4 p-5">
            <span
              className={`grid size-14 place-items-center rounded-3xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}
            >
              <card.icon className="size-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="font-display text-4xl font-bold text-blue-950">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.caption}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-blue-950">
            <Layers3 className="size-5 text-blue-600" />
            หมวดหมู่ทักษะ
          </h2>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(ALL_CATEGORIES)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${selectedCategory === ALL_CATEGORIES ? "bg-blue-100 text-blue-800 shadow-sm" : "hover:bg-white/80"}`}
            >
              <span className="flex items-center gap-3">
                <Layers3 className="size-5 text-blue-500" />
                ทั้งหมด
              </span>
              <span>{skills.length}</span>
            </button>
            {displayCategories.map((category, index) => {
              const icons = [Monitor, BarChart3, Users, Settings2, Factory, Tag];
              const Icon = icons[index % icons.length] ?? Tag;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${selectedCategory === category ? "bg-blue-100 text-blue-800 shadow-sm" : "hover:bg-white/80"}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-5 text-blue-500" />
                    {category}
                  </span>
                  <span>{categoryCount(category)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="panel overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <BarChart3 className="size-8" />
              </span>
              <div>
                <h2 className="flex items-center gap-2 font-display text-3xl font-bold text-blue-950">
                  <BarChart3 className="size-7 text-blue-600" />
                  {selectedSkill?.skill_name ?? "การวิเคราะห์ข้อมูล"}
                </h2>
                <p className="text-lg font-semibold text-slate-600">Data Analysis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-blue-100 text-blue-700">
                    {selectedSkill?.skill_category ?? "Digital & Technology"}
                  </Badge>
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                    ทักษะที่ใช้งาน
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Bookmark className="size-4" />
              </Button>
              <Button variant="outline">แก้ไข</Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="font-semibold text-blue-950">คำอธิบาย</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                ความสามารถในการรวบรวม จัดการ วิเคราะห์ และตีความข้อมูลอย่างเป็นระบบ
                เพื่อค้นหาข้อมูลเชิงลึก (Insight) และนำไปใช้ในการตัดสินใจ วางแผน
                หรือปรับปรุงการดำเนินงานขององค์กร
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-950">ตัวอย่างการใช้งาน</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>วิเคราะห์ผลการดำเนินงานการผลิต</li>
                <li>จัดทำรายงานและ Dashboard</li>
                <li>สนับสนุนการตัดสินใจเชิงกลยุทธ์</li>
                <li>ค้นหาแนวโน้มและโอกาสในการพัฒนา</li>
              </ul>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="font-semibold text-blue-950">ระดับความเชี่ยวชาญ (Proficiency Levels)</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              {LEVELS.map(([level, title, desc]) => (
                <div
                  key={level}
                  className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-100 font-bold text-blue-700">
                      {level}
                    </span>
                    <div>
                      <p className="font-bold text-blue-950">Level {level}</p>
                      <p className="text-xs font-semibold text-slate-600">{title}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Data", "Analytics", "Excel", "SQL", "Power BI", "Visualization"].map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full bg-blue-100 text-blue-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-blue-950">
            <Wrench className="size-5 text-cyan-600" />
            รายการทักษะในหมวดหมู่ (Skill Catalog)
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={skillSearch}
                onChange={(event) => setSkillSearch(event.target.value)}
                placeholder="ค้นหาทักษะในรายการ..."
                className="bg-white/90 pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[220px] bg-white/90">
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>ทั้งหมด</SelectItem>
                {displayCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-blue-100 bg-white/90">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/80">
                <TableHead className="w-10">
                  <input type="checkbox" aria-label="เลือกทั้งหมด" />
                </TableHead>
                <TableHead>
                  <IconHead icon={Hash}>รหัส</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Wrench}>ทักษะ</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Layers3}>หมวดหมู่</IconHead>
                </TableHead>
                <TableHead className="text-center">ระดับ</TableHead>
                <TableHead>
                  <IconHead icon={BadgeCheck}>สถานะ</IconHead>
                </TableHead>
                <TableHead>
                  <IconHead icon={Tag}>Tags</IconHead>
                </TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogSkills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    ยังไม่มีทักษะตามตัวกรอง
                  </TableCell>
                </TableRow>
              ) : (
                catalogSkills.map((skill, index) => {
                  const level = (index % 5) + 1;
                  return (
                    <TableRow key={skill.id}>
                      <TableCell>
                        <input type="checkbox" aria-label={skill.skill_name} />
                      </TableCell>
                      <TableCell className="font-semibold text-blue-950">
                        {skill.skill_code || `SK-${String(index + 1).padStart(3, "0")}`}
                      </TableCell>
                      <TableCell className="font-medium">{skill.skill_name}</TableCell>
                      <TableCell>{skill.skill_category}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="rounded-full bg-yellow-100 text-yellow-700">
                          ระดับ {level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${skill.active_status ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          <span
                            className={`size-2 rounded-full ${skill.active_status ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {skill.active_status ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {[skill.skill_category, "Production"].map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded-full bg-blue-50 text-blue-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <MoreHorizontal className="ml-auto size-4 text-slate-500" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
            <Plus className="size-5 text-blue-600" />
            เพิ่มทักษะ
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-500" />
              <Input
                className="pl-10"
                value={skillForm.skill_code}
                onChange={(event) => updateSkillForm("skill_code", event.target.value)}
                placeholder="รหัสทักษะ เช่น DT-001"
              />
            </div>
            <div className="relative">
              <Wrench className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-500" />
              <Input
                className="pl-10"
                value={skillForm.skill_name}
                onChange={(event) => updateSkillForm("skill_name", event.target.value)}
                placeholder="ชื่อทักษะ"
              />
            </div>
            <div className="relative md:col-span-2">
              <Tag className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-violet-500" />
              <Select
                value={skillForm.skill_category}
                onValueChange={(value) => updateSkillForm("skill_category", value)}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="หมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={addSkill} className="bg-gradient-to-r from-blue-600 to-cyan-500">
              <Plus className="mr-2 size-4" />
              เพิ่มทักษะ
            </Button>
            {skillError ? (
              <p className="text-sm font-medium text-destructive">{skillError}</p>
            ) : null}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
            <Factory className="size-5 text-amber-600" />
            เพิ่ม Production
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-500" />
              <Input
                className="pl-10"
                value={productionForm.code}
                onChange={(event) => updateProductionForm("code", event.target.value)}
                placeholder="รหัส Production"
              />
            </div>
            <div className="relative">
              <Factory className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-orange-500" />
              <Input
                className="pl-10"
                value={productionForm.name}
                onChange={(event) => updateProductionForm("name", event.target.value)}
                placeholder="ชื่อ Production"
              />
            </div>
            <div className="relative md:col-span-2">
              <Package className="pointer-events-none absolute left-3 top-3 size-4 text-emerald-500" />
              <Textarea
                className="pl-10"
                value={productionForm.product_types}
                onChange={(event) => updateProductionForm("product_types", event.target.value)}
                placeholder="ประเภทสินค้า"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={addProduction}
              className="bg-gradient-to-r from-amber-400 to-orange-500"
            >
              <Plus className="mr-2 size-4" />
              เพิ่ม Production
            </Button>
            {productionError ? (
              <p className="text-sm font-medium text-destructive">{productionError}</p>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
