import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Download,
  Factory,
  Hash,
  ImagePlus,
  Medal,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  type Employee,
  competencyName,
  useAssessments,
  useEmployees,
  useProductions,
} from "@/lib/skill-matrix";
import { saveLocalEmployees } from "@/lib/skill-matrix-storage";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Competency Matrix | SKILL MATRIX" },
      {
        name: "description",
        content: "จัดการข้อมูลพนักงานและดูเมทริกซ์สมรรถนะ",
      },
    ],
  }),
  component: EmployeesPage,
});

type EmployeeForm = {
  photo_url: string;
  employee_code: string;
  full_name: string;
  position: string;
  production_id: string;
  competency_level: string;
  start_work_date: string;
  jd_training_passed: boolean;
  wi_training_passed: boolean;
  remark: string;
};

const EMPTY_FORM: EmployeeForm = {
  photo_url: "",
  employee_code: "",
  full_name: "",
  position: "",
  production_id: "",
  competency_level: "1",
  start_work_date: "",
  jd_training_passed: true,
  wi_training_passed: false,
  remark: "",
};

const COMPETENCY_GROUPS = [
  { name: "สมรรถนะหลัก", value: 86, color: "from-cyan-400 to-blue-500" },
  { name: "สมรรถนะตามหน้าที่", value: 74, color: "from-violet-400 to-fuchsia-500" },
  { name: "ภาวะผู้นำ", value: 68, color: "from-amber-400 to-orange-500" },
  { name: "ทักษะดิจิทัล", value: 79, color: "from-emerald-400 to-teal-500" },
];

function CheckMark({ checked }: { checked?: boolean }) {
  return checked ? <ClipboardCheck className="mx-auto size-4 text-emerald-600" /> : <span>-</span>;
}

function safeFileName(value: string) {
  return (
    value
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "employees"
  );
}

function createPdfFromJpegs(images: string[], fileName: string) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  function pushText(text: string) {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function pushBinary(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function base64ByteLength(base64: string) {
    return atob(base64).length;
  }

  pushText("%PDF-1.4\n");
  images.forEach((image, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    offsets[pageObject] = byteLength;
    pushText(
      `${pageObject} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>\nendobj\n`,
    );
    offsets[imageObject] = byteLength;
    pushText(
      `${imageObject} 0 obj\n<< /Type /XObject /Subtype /Image /Width 794 /Height 1123 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${base64ByteLength(image)} >>\nstream\n`,
    );
    pushBinary(image);
    pushText("\nendstream\nendobj\n");
    const pdfContent = `q 595 0 0 842 0 0 cm /Im${index} Do Q`;
    offsets[contentObject] = byteLength;
    pushText(
      `${contentObject} 0 obj\n<< /Length ${pdfContent.length} >>\nstream\n${pdfContent}\nendstream\nendobj\n`,
    );
  });

  offsets[1] = byteLength;
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets[2] = byteLength;
  pushText(
    `2 0 obj\n<< /Type /Pages /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] /Count ${images.length} >>\nendobj\n`,
  );
  const xrefOffset = byteLength;
  const objectCount = images.length * 3 + 3;
  pushText(`xref\n0 ${objectCount}\n0000000000 65535 f \n`);
  for (let index = 1; index < objectCount; index += 1) {
    pushText(`${String(offsets[index] ?? 0).padStart(10, "0")} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const blob = new Blob(chunks, { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(fileName)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawEmployeePdfPage(
  employee: Employee,
  productionLabel: string,
  pageNumber: number,
  pageCount: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 794;
  canvas.height = 1123;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ไม่สามารถสร้างไฟล์ PDF ได้");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0f172a";
  context.font = "bold 34px system-ui, sans-serif";
  context.fillText("ข้อมูลพนักงาน", 56, 78);
  context.font = "18px system-ui, sans-serif";
  context.fillStyle = "#64748b";
  context.fillText(`หน้า ${pageNumber}/${pageCount}`, 640, 78);

  const rows = [
    ["รหัสพนักงาน", employee.employee_code || "-"],
    ["ชื่อ-นามสกุล", employee.full_name],
    ["ตำแหน่ง", employee.position || "-"],
    ["Production", productionLabel],
    ["วันที่เริ่มงาน", employee.start_work_date || "-"],
    ["ผ่านอบรม JD", employee.jd_training_passed ? "ผ่าน" : "-"],
    ["ผ่านอบรม WI", employee.wi_training_passed ? "ผ่าน" : "-"],
    ["ระดับ", competencyName(employee.competency_level)],
    ["หมายเหตุ", employee.remark || "-"],
  ];

  let y = 145;
  rows.forEach(([label, value], index) => {
    context.fillStyle = index % 2 === 0 ? "#f8fafc" : "#ffffff";
    context.fillRect(56, y - 30, 682, 54);
    context.strokeStyle = "#e2e8f0";
    context.strokeRect(56, y - 30, 682, 54);
    context.fillStyle = "#475569";
    context.font = "bold 18px system-ui, sans-serif";
    context.fillText(label, 82, y);
    context.fillStyle = "#0f172a";
    context.font = "18px system-ui, sans-serif";
    context.fillText(String(value).slice(0, 58), 280, y);
    y += 54;
  });

  context.fillStyle = "#94a3b8";
  context.font = "14px system-ui, sans-serif";
  context.fillText(`สร้างจาก SKILL MATRIX • ${new Date().toLocaleDateString("th-TH")}`, 56, 1060);
  return canvas.toDataURL("image/jpeg", 0.92).split(",")[1] ?? "";
}
function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const { data: assessments = [] } = useAssessments();
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [editingEmployeeId, setEditingEmployeeId] = useState("");

  const productionName = (id: string | null) =>
    productions.find((production) => production.id === id)?.name ?? "-";

  const filteredEmployees = employees.filter((employee) => employee.status !== "deleted");

  const selectedProductionEmployees = useMemo(() => {
    if (!form.production_id) return [];
    if (form.production_id === "none")
      return filteredEmployees.filter((employee) => !employee.production_id);
    return filteredEmployees.filter((employee) => employee.production_id === form.production_id);
  }, [filteredEmployees, form.production_id]);

  const selectedProductionName =
    form.production_id === "none"
      ? "ไม่ระบุ Production"
      : productionName(form.production_id || null);

  const assessedEmployeeIds = new Set(assessments.map((assessment) => assessment.employee_id));
  const assessedCount = filteredEmployees.filter((employee) =>
    assessedEmployeeIds.has(employee.id),
  ).length;
  const passRate = assessments.length
    ? Math.round(
        (assessments.reduce((total, assessment) => total + assessment.current_level, 0) /
          (assessments.length * 4)) *
          100,
      )
    : 0;
  const levelDistribution = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: assessments.filter((assessment) => assessment.current_level === level).length,
  }));
  const maxLevelCount = Math.max(1, ...levelDistribution.map((item) => item.count));
  const competencyGroups = COMPETENCY_GROUPS.map((group) => ({
    ...group,
    value: assessments.length ? group.value : 0,
  }));

  function updateProduction(value: string) {
    setForm((current) => ({ ...current, production_id: value }));
  }

  function updateField(field: keyof EmployeeForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm(productionId = "") {
    setEditingEmployeeId("");
    setForm({ ...EMPTY_FORM, production_id: productionId });
  }

  function editEmployee(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setForm({
      photo_url: employee.photo_url ?? "",
      employee_code: employee.employee_code ?? "",
      full_name: employee.full_name,
      position: employee.position ?? "",
      production_id: employee.production_id ?? "none",
      competency_level: String(employee.competency_level || 1),
      start_work_date: employee.start_work_date ?? "",
      jd_training_passed: Boolean(employee.jd_training_passed),
      wi_training_passed: Boolean(employee.wi_training_passed),
      remark: employee.remark ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(`ต้องการลบข้อมูลพนักงาน ${employee.full_name} หรือไม่?`);
    if (!confirmed) return;

    saveLocalEmployees(
      employees.map((currentEmployee) =>
        currentEmployee.id === employee.id
          ? { ...currentEmployee, status: "deleted" }
          : currentEmployee,
      ),
    );
    if (editingEmployeeId === employee.id) resetForm(form.production_id);
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  }

  function updatePhoto(file: File | undefined) {
    if (!file) {
      updateField("photo_url", "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateField("photo_url", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function downloadEmployeePdf(employee: Employee) {
    const image = drawEmployeePdfPage(employee, productionName(employee.production_id), 1, 1);
    createPdfFromJpegs([image], `ข้อมูลพนักงาน-${employee.full_name}`);
  }

  function downloadProductionPdf() {
    if (selectedProductionEmployees.length === 0) return;
    const images = selectedProductionEmployees.map((employee, index) =>
      drawEmployeePdfPage(
        employee,
        productionName(employee.production_id),
        index + 1,
        selectedProductionEmployees.length,
      ),
    );
    createPdfFromJpegs(images, `ข้อมูลพนักงาน-${selectedProductionName}`);
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = form.full_name.trim();
    if (!fullName) return;

    const nextEmployee: Employee = {
      id: editingEmployeeId || `local-employee-${Date.now()}`,
      photo_url: form.photo_url || null,
      employee_code: form.employee_code.trim() || null,
      full_name: fullName,
      position: form.position.trim(),
      production_id:
        form.production_id && form.production_id !== "none" ? form.production_id : null,
      start_work_date: form.start_work_date || null,
      jd_training_passed: form.jd_training_passed,
      wi_training_passed: form.wi_training_passed,
      competency_level: Number(form.competency_level),
      status: "active",
      remark: form.remark.trim() || null,
    };

    saveLocalEmployees(
      editingEmployeeId
        ? employees.map((employee) =>
            employee.id === editingEmployeeId ? nextEmployee : employee,
          )
        : [...employees, nextEmployee],
    );
    resetForm(nextEmployee.production_id ?? "");
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  }

  return (
    <AppShell title="Competency Matrix" description="เมทริกซ์สมรรถนะพนักงานและโครงสร้างกำลังคน">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 p-6 text-white shadow-2xl shadow-sky-200/60">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <Badge className="mb-4 border-white/30 bg-white/20 text-white hover:bg-white/20">
              HRD Platform
            </Badge>
            <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight md:text-5xl">
              <Medal className="size-9 text-white" />
              Competency Matrix
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-white/85 md:text-base">
              ภาพรวมสมรรถนะรายบุคคล เทียบระดับปัจจุบันกับระดับที่ต้องการ
              สำหรับวางแผนพัฒนาและจัดลำดับ Skill Gap
            </p>
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/15 p-5 backdrop-blur">
            <p className="text-sm text-white/75">Overall Readiness</p>
            <div className="mt-4 text-5xl font-black">{passRate}%</div>
            <div className="mt-4 h-3 rounded-full bg-white/25">
              <div className="h-3 rounded-full bg-white" style={{ width: `${passRate}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "พนักงานทั้งหมด",
            value: filteredEmployees.length,
            icon: Users,
            color: "from-sky-500 to-cyan-400",
          },
          {
            label: "จำนวน Production",
            value: productions.length,
            icon: ShieldCheck,
            color: "from-violet-500 to-fuchsia-400",
          },
          {
            label: "ประเมินระดับแล้ว",
            value: assessedCount,
            icon: BadgeCheck,
            color: "from-emerald-500 to-teal-400",
          },
          {
            label: "ค่าเฉลี่ยความพร้อม",
            value: `${passRate}%`,
            icon: TrendingUp,
            color: "from-rose-500 to-orange-400",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-white/70 bg-white p-5 shadow-xl shadow-slate-200/70"
          >
            <div
              className={cn(
                "mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white",
                card.color,
              )}
            >
              <card.icon className="size-6" />
            </div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>


      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-900">
            <BarChart3 className="size-5 text-violet-600" />
            สรุประดับสมรรถนะตามกลุ่ม
          </h2>
          <div className="space-y-5">
            {competencyGroups.map((group) => (
              <div key={group.name}>
                <div className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                  <span>{group.name}</span>
                  <span>{group.value}%</span>
                </div>
                <div className="h-4 rounded-full bg-slate-100">
                  <div
                    className={cn("h-4 rounded-full bg-gradient-to-r", group.color)}
                    style={{ width: `${group.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-900">
            <Sparkles className="size-5 text-amber-500" />
            Distribution
          </h2>
          <div className="space-y-4">
            {levelDistribution.map((item) => (
              <div
                key={item.level}
                className="grid grid-cols-[70px_1fr_36px] items-center gap-3 text-sm"
              >
                <span className="font-semibold text-slate-600">Level {item.level}</span>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                    style={{ width: `${(item.count / maxLevelCount) * 100}%` }}
                  />
                </div>
                <span className="text-right font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Plus className="size-5 text-sky-600" />
              {editingEmployeeId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มข้อมูลพนักงาน"}
            </h2>
            <p className="text-sm text-slate-500">{editingEmployeeId ? "แก้ไขข้อมูลพนักงานที่เลือก" : "เพิ่มข้อมูลใหม่สำหรับใช้ในเมทริกซ์สมรรถนะ"}</p>
          </div>
          <Button className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700">
            <Plus className="mr-2 size-4" />
            {editingEmployeeId ? "บันทึกการแก้ไข" : "บันทึกพนักงาน"}
          </Button>
        {editingEmployeeId ? (
            <Button type="button" variant="outline" onClick={() => resetForm(form.production_id)}>
              <X className="mr-2 size-4" />
              ยกเลิกแก้ไข
            </Button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr]">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <div className="mx-auto mb-3 grid size-24 place-items-center overflow-hidden rounded-full bg-white text-slate-400 shadow-inner">
              {form.photo_url ? (
                <img src={form.photo_url} alt="preview" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-8" />
              )}
            </div>
            <Label
              htmlFor="photo"
              className="flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold text-sky-700"
            >
              <ImagePlus className="size-4" />
              อัปโหลดรูป
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => updatePhoto(event.target.files?.[0])}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="size-4 text-violet-500" />
                รหัสพนักงาน
              </Label>
              <Input
                value={form.employee_code}
                onChange={(event) => updateField("employee_code", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserRound className="size-4 text-sky-500" />
                ชื่อ-นามสกุล
              </Label>
              <Input
                required
                value={form.full_name}
                onChange={(event) => updateField("full_name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-emerald-500" />
                ตำแหน่ง
              </Label>
              <Input
                value={form.position}
                onChange={(event) => updateField("position", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Factory className="size-4 text-amber-500" />
                Production
              </Label>
              <Select value={form.production_id} onValueChange={updateProduction}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Production" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ Production</SelectItem>
                  {productions.map((production) => (
                    <SelectItem key={production.id} value={production.id}>
                      {production.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="size-4 text-blue-500" />
                วันที่เริ่มงาน
              </Label>
              <Input
                type="date"
                value={form.start_work_date}
                onChange={(event) => updateField("start_work_date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Medal className="size-4 text-rose-500" />
                ระดับ Competency
              </Label>
              <Select
                value={form.competency_level}
                onValueChange={(value) => updateField("competency_level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      {competencyName(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
              <Checkbox
                checked={form.jd_training_passed}
                onCheckedChange={(checked) => updateField("jd_training_passed", Boolean(checked))}
              />
              <Label className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                ผ่านอบรม JD
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
              <Checkbox
                checked={form.wi_training_passed}
                onCheckedChange={(checked) => updateField("wi_training_passed", Boolean(checked))}
              />
              <Label className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-blue-500" />
                ผ่านอบรม WI
              </Label>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="flex items-center gap-2">
                <MessageSquareText className="size-4 text-slate-500" />
                หมายเหตุ
              </Label>
              <Textarea
                value={form.remark}
                onChange={(event) => updateField("remark", event.target.value)}
              />
            </div>
          </div>
        </div>
      </form>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Factory className="size-5 text-amber-600" />
              รายชื่อพนักงานตาม Production
            </h2>
            <p className="text-sm text-slate-500">
              เลือก Production ในฟอร์มเพิ่มพนักงาน เพื่อดูรายชื่อกลุ่มเดียวกัน
            </p>
          </div>
                    <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{selectedProductionName}</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={downloadProductionPdf}
              disabled={selectedProductionEmployees.length === 0}
            >
              <Download className="mr-2 size-4" />
              โหลด PDF ทั้งแผนก
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>
                  <span className="flex items-center gap-2">
                    <ImagePlus className="size-4 text-sky-500" />
                    รูป
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <Hash className="size-4 text-violet-500" />
                    รหัส
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <UserRound className="size-4 text-sky-500" />
                    ชื่อ-นามสกุล
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness className="size-4 text-amber-500" />
                    ตำแหน่ง
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <Factory className="size-4 text-fuchsia-500" />
                    Production
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-teal-500" />
                    วันที่เริ่มงาน
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  <span className="flex items-center justify-center gap-2">
                    <ClipboardCheck className="size-4 text-emerald-500" />
                    ผ่านอบรม JD
                  </span>
                </TableHead>
                <TableHead className="text-center">
                  <span className="flex items-center justify-center gap-2">
                    <ClipboardCheck className="size-4 text-emerald-500" />
                    ผ่านอบรม WI
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <Medal className="size-4 text-orange-500" />
                    ระดับ
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <MessageSquareText className="size-4 text-slate-500" />
                    หมายเหตุ
                  </span>
                </TableHead>
              <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!form.production_id ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-slate-500">
                    เลือก Production ด้านบนเพื่อแสดงข้อมูลพนักงาน
                  </TableCell>
                </TableRow>
              ) : selectedProductionEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-slate-500">
                    ไม่พบข้อมูลพนักงานใน {selectedProductionName}
                  </TableCell>
                </TableRow>
              ) : (
                selectedProductionEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      {employee.photo_url ? (
                        <img
                          src={employee.photo_url}
                          alt={employee.full_name}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <UserRound className="size-4" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{employee.employee_code || "-"}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {employee.full_name}
                    </TableCell>
                    <TableCell>{employee.position || "-"}</TableCell>
                    <TableCell>{productionName(employee.production_id)}</TableCell>
                    <TableCell>{employee.start_work_date || "-"}</TableCell>
                    <TableCell className="text-center">
                      <CheckMark checked={employee.jd_training_passed} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CheckMark checked={employee.wi_training_passed} />
                    </TableCell>
                    <TableCell>{competencyName(employee.competency_level)}</TableCell>
                    <TableCell className="text-slate-500">{employee.remark || "-"}</TableCell>
                  <TableCell>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => downloadEmployeePdf(employee)}>
                          <Download className="mr-1 size-3.5" />
                          PDF
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => editEmployee(employee)}>
                          <Pencil className="mr-1 size-3.5" />
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => deleteEmployee(employee)}
                        >
                          <Trash2 className="mr-1 size-3.5" />
                          ลบ
                        </Button>
                      </div>
                    </TableCell>
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
