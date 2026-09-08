import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Factory, Layers3, Plus, Settings2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      {
        name: "description",
        content: "จัดการ Production และรายการทักษะด้วย localStorage",
      },
    ],
  }),
  component: SkillProductionPage,
});

type ProductionForm = {
  code: string;
  name: string;
  product_types: string;
};

type SkillForm = {
  skill_code: string;
  skill_name: string;
  skill_category: string;
};

const EMPTY_PRODUCTION_FORM: ProductionForm = {
  code: "",
  name: "",
  product_types: "",
};

const EMPTY_SKILL_FORM: SkillForm = {
  skill_code: "",
  skill_name: "",
  skill_category: "ทั่วไป",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function SkillProductionPage() {
  const queryClient = useQueryClient();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: employees = [] } = useEmployees();
  const [productionForm, setProductionForm] = useState<ProductionForm>(EMPTY_PRODUCTION_FORM);
  const [skillForm, setSkillForm] = useState<SkillForm>(EMPTY_SKILL_FORM);
  const [productionError, setProductionError] = useState("");
  const [skillError, setSkillError] = useState("");

  const skillCategories = useMemo(
    () =>
      [...new Set(skills.map((skill) => skill.skill_category))].sort((a, b) =>
        a.localeCompare(b, "th"),
      ),
    [skills],
  );

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
      description="จัดการ Production และรายการทักษะ เก็บข้อมูลใน localStorage"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel overflow-hidden p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/20">
              <Factory className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                เพิ่ม Production
              </h2>
              <p className="text-sm text-muted-foreground">กำหนดสายการผลิตและประเภทสินค้า</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="production-code">รหัส Production</Label>
              <Input
                id="production-code"
                value={productionForm.code}
                onChange={(event) => updateProductionForm("code", event.target.value)}
                placeholder="เช่น P6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="production-name">ชื่อ Production</Label>
              <Input
                id="production-name"
                value={productionForm.name}
                onChange={(event) => updateProductionForm("name", event.target.value)}
                placeholder="เช่น Production 6"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-types">ประเภทสินค้า</Label>
              <Textarea
                id="product-types"
                value={productionForm.product_types}
                onChange={(event) => updateProductionForm("product_types", event.target.value)}
                placeholder="เช่น ยาน้ำ, ผง, เม็ด"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={addProduction}
              className="bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20"
            >
              <Plus className="mr-2 size-4" />
              เพิ่ม Production
            </Button>
            {productionError ? (
              <p className="text-sm font-medium text-destructive">{productionError}</p>
            ) : null}
          </div>
        </section>

        <section className="panel overflow-hidden p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
              <Settings2 className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">เพิ่มทักษะ</h2>
              <p className="text-sm text-muted-foreground">กำหนดรหัส ชื่อ และหมวดหมู่ทักษะ</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skill-code">รหัสทักษะ</Label>
              <Input
                id="skill-code"
                value={skillForm.skill_code}
                onChange={(event) => updateSkillForm("skill_code", event.target.value)}
                placeholder="เช่น S19"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-category">หมวดหมู่</Label>
              <Input
                id="skill-category"
                list="skill-categories"
                value={skillForm.skill_category}
                onChange={(event) => updateSkillForm("skill_category", event.target.value)}
                placeholder="เช่น บรรจุ"
              />
              <datalist id="skill-categories">
                {skillCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="skill-name">ชื่อทักษะ</Label>
              <Input
                id="skill-name"
                value={skillForm.skill_name}
                onChange={(event) => updateSkillForm("skill_name", event.target.value)}
                placeholder="เช่น ตรวจสอบเอกสารการผลิต"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={addSkill}
              className="bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20"
            >
              <Plus className="mr-2 size-4" />
              เพิ่มทักษะ
            </Button>
            {skillError ? (
              <p className="text-sm font-medium text-destructive">{skillError}</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/20">
                <Factory className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  Production ทั้งหมด
                </h2>
                <p className="text-sm text-muted-foreground">
                  รายการทั้งหมด {productions.length} Production
                </p>
              </div>
            </div>
            <Badge className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
              localStorage
            </Badge>
          </div>

          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>ประเภทสินค้า</TableHead>
                  <TableHead className="text-right">พนักงาน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((production) => (
                  <TableRow key={production.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {production.code}
                    </TableCell>
                    <TableCell>{production.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {production.product_types || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {
                        employees.filter((employee) => employee.production_id === production.id)
                          .length
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="panel overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
                <Layers3 className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  รายการทักษะทั้งหมด
                </h2>
                <p className="text-sm text-muted-foreground">ทักษะทั้งหมด {skills.length} รายการ</p>
              </div>
            </div>
            <Badge className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              {skillCategories.length} หมวดหมู่
            </Badge>
          </div>

          <div className="mt-5 max-h-[520px] overflow-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ทักษะ</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {skill.skill_code || "-"}
                    </TableCell>
                    <TableCell>{skill.skill_name}</TableCell>
                    <TableCell>{skill.skill_category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={skill.active_status ? "secondary" : "outline"}
                        className="rounded-full"
                      >
                        {skill.active_status ? "ใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
