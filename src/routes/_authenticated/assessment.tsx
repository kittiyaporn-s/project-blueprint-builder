import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  Clock,
  Download,
  Factory,
  FileText,
  Gauge,
  MessageSquareText,
  Pencil,
  PieChart,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TriangleAlert,
  UserCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  SKILL_LEVELS,
  type Assessment,
  type Employee,
  type GapRow,
  type Production,
  buildGapRows,
  useAssessments,
  useEmployees,
  useProductions,
  useSkills,
} from "@/lib/skill-matrix";
import { getLocalAssessments, saveLocalAssessments } from "@/lib/skill-matrix-storage";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "ประเมินทักษะ | SKILL MATRIX" },
      {
        name: "description",
        content: "บันทึกและอัปเดตผลประเมินทักษะด้วย localStorage",
      },
    ],
  }),
  component: AssessmentPage,
});

type AssessmentForm = {
  production_id: string;
  employee_id: string;
  skill_ids: string[];
  current_level: string;
  target_level: string;
  assessor: string;
  assessment_date: string;
  remark: string;
};

const EMPTY_FORM: AssessmentForm = {
  production_id: "",
  employee_id: "",
  skill_ids: [],
  current_level: "1",
  target_level: "3",
  assessor: "",
  assessment_date: new Date().toISOString().slice(0, 10),
  remark: "",
};

const ALL_PRODUCTIONS = "all-productions";

const ASSESSOR_OPTIONS = [
  {
    id: "p1-leader",
    full_name: "จัญญา สายกระสูน",
    position: "หัวหน้าผลิต Production 1",
    production_id: "Production 1",
  },
  {
    id: "p2-leader",
    full_name: "กิตติยาภรณ์ ศรีพุ่มไข่",
    position: "หัวหน้าผลิต Production 2",
    production_id: "Production 2",
  },
  {
    id: "p3-leader",
    full_name: "ดวงพร ก้านทอง",
    position: "หัวหน้าผลิต Production 3",
    production_id: "Production 3",
  },
  {
    id: "p3-assistant",
    full_name: "ณัฐวุฒิ แซ่ตั้ง",
    position: "ผู้ช่วยหัวหน้า Production 3",
    production_id: "Production 3",
  },
  {
    id: "p4-leader",
    full_name: "อัจฉรา บุญไทย",
    position: "หัวหน้าผลิต Production 4",
    production_id: "Production 4",
  },
  {
    id: "p5-leader",
    full_name: "วัลลิภา กลิ่นพยอม",
    position: "หัวหน้าผลิต Production 5",
    production_id: "Production 5",
  },
  {
    id: "p5-assistant",
    full_name: "วรรณนภา นราแก้ว",
    position: "ผู้ช่วยหัวหน้า Production 5",
    production_id: "Production 5",
  },
  {
    id: "ldi-assistant",
    full_name: "ประภาวดี เวตะนัต",
    position: "ผู้ช่วยหัวหน้า Production LDI",
    production_id: "Production LDI",
  },
];
function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `assessment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function productionName(productions: Production[], productionId: string | null) {
  return productions.find((production) => production.id === productionId)?.name ?? productionId ?? "-";
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "assessment-report";
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      continue;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawReportPage(
  rows: GapRow[],
  employee: Employee,
  productions: Production[],
  pageNumber: number,
  pageTotal: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 794;
  canvas.height = 1123;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ไม่สามารถสร้างไฟล์ PDF ได้");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#eef2ff";
  context.beginPath();
  context.arc(90, 70, 160, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ecfeff";
  context.beginPath();
  context.arc(700, 60, 180, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#111827";
  context.font = "700 30px 'Tahoma', 'Arial', sans-serif";
  context.fillText("รายงานผลประเมินทักษะ", 56, 82);
  context.font = "600 16px 'Tahoma', 'Arial', sans-serif";
  context.fillStyle = "#4f46e5";
  context.fillText("SKILL MATRIX Production 1-LDI", 56, 112);

  context.fillStyle = "#f8fafc";
  context.strokeStyle = "#dbeafe";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(56, 145, 682, 120, 18);
  context.fill();
  context.stroke();

  context.fillStyle = "#0f172a";
  context.font = "700 22px 'Tahoma', 'Arial', sans-serif";
  context.fillText(employee.full_name, 82, 185);
  context.font = "400 15px 'Tahoma', 'Arial', sans-serif";
  context.fillStyle = "#475569";
  context.fillText(`รหัสพนักงาน: ${employee.employee_code ?? "-"}`, 82, 215);
  context.fillText(`ตำแหน่ง: ${employee.position || "-"}`, 82, 240);
  context.fillText(`แผนก: ${productionName(productions, employee.production_id)}`, 410, 215);
  context.fillText(`จำนวนรายการประเมิน: ${rows.length}`, 410, 240);

  const tableTop = 305;
  const columns = [56, 150, 360, 452, 542, 620];
  context.fillStyle = "#4f46e5";
  context.beginPath();
  context.roundRect(56, tableTop, 682, 42, 12);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "700 13px 'Tahoma', 'Arial', sans-serif";
  ["วันที่", "ทักษะ", "ปัจจุบัน", "เป้าหมาย", "Gap", "ผู้ประเมิน"].forEach((label, index) => {
    context.fillText(label, columns[index], tableTop + 27);
  });

  let y = tableTop + 66;
  context.font = "400 12px 'Tahoma', 'Arial', sans-serif";
  rows.slice(0, 14).forEach((row, index) => {
    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8fafc";
    context.fillRect(56, y - 22, 682, 44);
    context.fillStyle = "#334155";
    context.fillText(row.assessment.assessment_date, columns[0], y);
    wrapCanvasText(context, row.skill.skill_name, 190).slice(0, 2).forEach((line, lineIndex) => {
      context.fillText(line, columns[1], y + lineIndex * 15);
    });
    context.fillText(String(row.assessment.current_level), columns[2] + 26, y);
    context.fillText(String(row.assessment.target_level), columns[3] + 28, y);
    context.fillStyle = row.gap > 0 ? "#e11d48" : "#059669";
    context.fillText(String(row.gap), columns[4] + 10, y);
    context.fillStyle = "#334155";
    wrapCanvasText(context, row.assessment.assessor || "-", 110).slice(0, 2).forEach((line, lineIndex) => {
      context.fillText(line, columns[5], y + lineIndex * 15);
    });
    y += 44;
  });

  context.fillStyle = "#64748b";
  context.font = "400 12px 'Tahoma', 'Arial', sans-serif";
  context.fillText(`สร้างรายงานวันที่ ${new Date().toLocaleDateString("th-TH")}`, 56, 1078);
  context.fillText(`หน้า ${pageNumber}/${pageTotal}`, 680, 1078);

  return canvas.toDataURL("image/jpeg", 0.92).split(",")[1] ?? "";
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
    pushText(`${pageObject} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>\nendobj\n`);
    offsets[imageObject] = byteLength;
    pushText(`${imageObject} 0 obj\n<< /Type /XObject /Subtype /Image /Width 794 /Height 1123 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${base64ByteLength(image)} >>\nstream\n`);
    pushBinary(image);
    pushText("\nendstream\nendobj\n");
    const content = `q 595 0 0 842 0 0 cm /Im${index} Do Q`;
    offsets[contentObject] = byteLength;
    pushText(`${contentObject} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  });

  offsets[1] = byteLength;
  pushText(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  offsets[2] = byteLength;
  pushText(`2 0 obj\n<< /Type /Pages /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] /Count ${images.length} >>\nendobj\n`);
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

function AssessmentPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const { data: skills = [] } = useSkills();
  const { data: assessments = [] } = useAssessments();
  const [form, setForm] = useState<AssessmentForm>(EMPTY_FORM);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [assessorPickerOpen, setAssessorPickerOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState("");
  const [reportProductionId, setReportProductionId] = useState(ALL_PRODUCTIONS);
  const [assessmentYear, setAssessmentYear] = useState("2569");
  const [error, setError] = useState("");

  const selectedEmployee = employees.find((employee) => employee.id === form.employee_id);
  const selectedSkills = skills.filter((skill) => form.skill_ids.includes(skill.id));
  const selectedProduction = productions.find((production) => production.id === form.production_id);
  const filteredEmployees = form.production_id
    ? employees.filter((employee) => employee.production_id === form.production_id)
    : employees;
  const assessorOptions = ASSESSOR_OPTIONS;

  const rows = buildGapRows(employees, skills, assessments).sort(
    (firstRow, secondRow) =>
      secondRow.assessment.assessment_date.localeCompare(firstRow.assessment.assessment_date) ||
      firstRow.employee.full_name.localeCompare(secondRow.employee.full_name, "th"),
  );
  const reportRows = reportProductionId === ALL_PRODUCTIONS
    ? rows
    : rows.filter((row) => row.employee.production_id === reportProductionId);
  const assessedEmployeeCount = new Set(rows.map((row) => row.employee.id)).size;
  const pendingEmployeeCount = Math.max(employees.length - assessedEmployeeCount, 0);
  const inProgressCount = rows.filter((row) => row.assessment.current_level < row.assessment.target_level).length;
  const completedPercent = employees.length ? Math.round((assessedEmployeeCount / employees.length) * 100) : 0;
  const averageScore = rows.length
    ? (rows.reduce((total, row) => total + row.assessment.current_level, 0) / rows.length).toFixed(1)
    : "0.0";
  const productionProgress = productions.slice(0, 7).map((production) => {
    const productionEmployees = employees.filter((employee) => employee.production_id === production.id);
    const productionAssessed = new Set(
      rows.filter((row) => row.employee.production_id === production.id).map((row) => row.employee.id),
    ).size;
    const done = productionEmployees.length
      ? Math.round((productionAssessed / productionEmployees.length) * 100)
      : 0;
    const progress = Math.max(0, Math.min(100 - done, Math.round(inProgressCount / Math.max(rows.length, 1) * 100)));
    return { name: production.name, count: productionEmployees.length, done, progress, pending: Math.max(100 - done - progress, 0) };
  });
  const scoreBands = [
    { label: "ต่ำกว่า 50", count: rows.filter((row) => row.assessment.current_level <= 1).length, color: "from-blue-300 to-blue-500" },
    { label: "50 - 59", count: rows.filter((row) => row.assessment.current_level === 2).length, color: "from-indigo-300 to-blue-500" },
    { label: "60 - 69", count: rows.filter((row) => row.assessment.current_level === 3).length, color: "from-sky-300 to-blue-500" },
    { label: "70 - 79", count: rows.filter((row) => row.assessment.current_level === 4).length, color: "from-blue-400 to-cyan-500" },
    { label: "80 - 89", count: rows.filter((row) => row.assessment.current_level >= 4 && row.gap <= 0).length, color: "from-cyan-300 to-sky-500" },
    { label: "90 - 100", count: rows.filter((row) => row.assessment.current_level >= 4 && row.gap < 0).length, color: "from-cyan-400 to-teal-500" },
  ];
  const maxScoreBand = Math.max(...scoreBands.map((band) => band.count), 1);
  const assessmentYears = Array.from({ length: 12 }, (_, index) => String(2569 + index));

  function updateForm(key: keyof AssessmentForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function updateProduction(productionId: string) {
    setForm((current) => ({
      ...current,
      production_id: productionId,
      employee_id: current.employee_id && employees.find((employee) => employee.id === current.employee_id)?.production_id === productionId
        ? current.employee_id
        : "",
    }));
    setError("");
  }

  function toggleSkill(skillId: string) {
    setForm((current) => ({
      ...current,
      skill_ids: current.skill_ids.includes(skillId)
        ? current.skill_ids.filter((currentSkillId) => currentSkillId !== skillId)
        : [...current.skill_ids, skillId],
    }));
    setError("");
  }

  function editAssessment(assessment: Assessment) {
    const employee = employees.find((currentEmployee) => currentEmployee.id === assessment.employee_id);
    setEditingAssessmentId(assessment.id);
    setForm({
      production_id: employee?.production_id ?? "",
      employee_id: assessment.employee_id,
      skill_ids: [assessment.skill_id],
      current_level: String(assessment.current_level),
      target_level: String(assessment.target_level),
      assessor: assessment.assessor ?? "",
      assessment_date: assessment.assessment_date,
      remark: assessment.remark ?? "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingAssessmentId("");
    setForm(EMPTY_FORM);
    setError("");
  }

  async function deleteAssessment(assessmentId: string) {
    const confirmed = window.confirm("ต้องการลบผลประเมินรายการนี้หรือไม่?");
    if (!confirmed) return;

    saveLocalAssessments(getLocalAssessments().filter((assessment) => assessment.id !== assessmentId));
    await queryClient.invalidateQueries({ queryKey: ["assessments"] });
    if (editingAssessmentId === assessmentId) cancelEdit();
  }

  async function saveAssessment() {
    if (!form.employee_id) {
      setError("กรุณาเลือกพนักงาน");
      return;
    }
    if (form.skill_ids.length === 0) {
      setError("กรุณาเลือกทักษะ");
      return;
    }

    const currentAssessments = getLocalAssessments();
    const nextAssessments = [...currentAssessments];

    form.skill_ids.forEach((skillId) => {
      const existingIndex = nextAssessments.findIndex((assessment) =>
        editingAssessmentId
          ? assessment.id === editingAssessmentId
          : assessment.employee_id === form.employee_id && assessment.skill_id === skillId,
      );
      const nextAssessment: Assessment = {
        id: existingIndex >= 0 ? nextAssessments[existingIndex]!.id : createId(),
        employee_id: form.employee_id,
        skill_id: skillId,
        current_level: Number(form.current_level),
        target_level: Number(form.target_level),
        assessor: form.assessor.trim() || null,
        assessment_date: form.assessment_date,
        remark: form.remark.trim() || null,
      };

      if (existingIndex >= 0) nextAssessments[existingIndex] = nextAssessment;
      else nextAssessments.push(nextAssessment);
    });

    saveLocalAssessments(nextAssessments);
    await queryClient.invalidateQueries({ queryKey: ["assessments"] });
    setEditingAssessmentId("");
    setForm({ ...EMPTY_FORM, production_id: form.production_id, employee_id: form.employee_id });
  }

  function downloadEmployeePdf(employeeId: string) {
    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);
    if (!employee) return;
    const employeeRows = rows.filter((row) => row.employee.id === employeeId);
    if (employeeRows.length === 0) return;
    const images = [drawReportPage(employeeRows, employee, productions, 1, 1)];
    createPdfFromJpegs(images, `ผลประเมิน-${employee.full_name}`);
  }

  function downloadProductionPdf() {
    if (reportRows.length === 0) return;

    const employeeIds = Array.from(new Set(reportRows.map((row) => row.employee.id)));
    const pages = employeeIds.flatMap((employeeId) => {
      const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);
      if (!employee) return [];
      return [{ employee, rows: reportRows.filter((row) => row.employee.id === employeeId) }];
    });
    const images = pages.map((page, index) => drawReportPage(page.rows, page.employee, productions, index + 1, pages.length));
    const selectedProductionName = reportProductionId === ALL_PRODUCTIONS
      ? "ทุกแผนก"
      : productionName(productions, reportProductionId);
    createPdfFromJpegs(images, `ผลประเมิน-${selectedProductionName}`);
  }

  return (
    <AppShell title="Assessment Management" description="บริหารจัดการการประเมินผลสมรรถนะ">
      <section className="panel overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <ClipboardCheck className="size-8" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-blue-950">Assessment Management</h1>
              <p className="text-sm font-semibold text-slate-600">บริหารจัดการการประเมินผลสมรรถนะ</p>
              <p className="text-xs text-muted-foreground">Manage Competency Assessment and Review Cycles</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={assessmentYear} onValueChange={setAssessmentYear}>
              <SelectTrigger className="w-[160px] bg-white/90 font-semibold text-blue-950 shadow-sm">
                <CalendarDays className="mr-2 size-4 text-blue-500" />
                <SelectValue placeholder="เลือกรอบปี" />
              </SelectTrigger>
              <SelectContent>
                {assessmentYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    รอบปี {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
              <Plus className="mr-2 size-4" /> สร้างแบบประเมินใหม่
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "พนักงานทั้งหมด", value: employees.length, caption: "คน", tone: "from-blue-500 to-cyan-500", trend: "+3.2%" },
          { icon: Check, label: "ตอบแบบประเมินแล้ว", value: assessedEmployeeCount, caption: "คน", tone: "from-emerald-400 to-teal-500", trend: "+5.6%" },
          { icon: Clock, label: "อยู่ระหว่างประเมิน", value: inProgressCount, caption: "งาน", tone: "from-amber-300 to-orange-500", trend: "-2.1%" },
          { icon: TriangleAlert, label: "ยังไม่ได้ประเมิน", value: pendingEmployeeCount, caption: "คน", tone: "from-rose-400 to-red-500", trend: "-3.5%" },
        ].map((card) => (
          <div key={card.label} className="panel flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <span className={`grid size-14 place-items-center rounded-3xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                <card.icon className="size-7" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{card.label}</p>
                <p className="font-display text-4xl font-bold text-blue-950">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.caption}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">▲ {card.trend}</span>
          </div>
        ))}
      </section>


      <section className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold text-blue-950">ความคืบหน้าการประเมินรายหน่วยงาน</h2><p className="text-sm text-muted-foreground">สัดส่วนการดำเนินการประเมินในแต่ละหน่วยงาน</p></div><Button variant="link">ดูทั้งหมด</Button></div>
          <div className="mt-4 space-y-3">
            {productionProgress.map((item) => (
              <div key={item.name} className="grid gap-2 md:grid-cols-[160px_60px_1fr] md:items-center">
                <div className="truncate text-sm font-semibold text-slate-700">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.count} คน</div>
                <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-center text-xs font-bold text-white" style={{ width: `${item.done}%` }}>{item.done}%</div>
                  <div className="bg-gradient-to-r from-blue-400 to-sky-500 text-center text-xs font-bold text-white" style={{ width: `${item.progress}%` }} />
                  <div className="bg-gradient-to-r from-amber-300 to-orange-400" style={{ width: `${item.pending}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold text-blue-950">การกระจายคะแนนผลการประเมิน</h2><p className="text-sm text-muted-foreground">จัดกลุ่มคะแนนจากระดับทักษะที่บันทึกไว้</p></div><Button variant="link">ดูรายละเอียด</Button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_160px]">
            <div className="flex h-56 items-end gap-3 rounded-2xl bg-blue-50/50 p-4">
              {scoreBands.map((band) => (
                <div key={band.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-bold text-blue-950">{band.count}</div>
                  <div className={`w-full rounded-t-xl bg-gradient-to-t ${band.color}`} style={{ height: `${Math.max(16, (band.count / maxScoreBand) * 150)}px` }} />
                  <div className="text-[10px] text-slate-500">{band.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-blue-50 p-4"><Star className="size-7 text-blue-500" /><p className="mt-2 text-sm text-slate-600">คะแนนเฉลี่ยรวม</p><p className="text-3xl font-bold text-blue-950">{averageScore}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">▲ สูงสุด {rows.length ? Math.max(...rows.map((row) => row.assessment.current_level)) : 0}</div>
              <div className="rounded-2xl bg-rose-50 p-4 text-rose-700">▼ ต่ำสุด {rows.length ? Math.min(...rows.map((row) => row.assessment.current_level)) : 0}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <ClipboardCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {editingAssessmentId ? "แก้ไขผลประเมิน" : "บันทึกผลประเมิน"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {editingAssessmentId
                  ? "กำลังแก้ไขรายการประเมินล่าสุด กดบันทึกเพื่ออัปเดตข้อมูล"
                  : "เลือกพนักงานและทักษะ ถ้ามีรายการเดิม ระบบจะอัปเดตทับให้อัตโนมัติ"}
              </p>
            </div>
          </div>
          <div className="min-w-[260px] space-y-2">
            <Label className="flex items-center gap-2">
              <Factory className="size-4 text-fuchsia-500" />
              Production
            </Label>
            <Select value={form.production_id} onValueChange={updateProduction}>
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="เลือก Production" />
              </SelectTrigger>
              <SelectContent>
                {productions.map((production) => (
                  <SelectItem key={production.id} value={production.id}>
                    {production.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertCircle className="mt-0.5 size-5" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">ยังไม่มีข้อมูลพนักงาน</div>
              <p className="text-sm">ไปที่หน้า “ข้อมูลพนักงาน” เพื่อเพิ่มพนักงานก่อนประเมินทักษะ</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-amber-300 bg-white/70 text-amber-900"
            >
              <Link to="/employees">ไปเพิ่มพนักงาน</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserRound className="size-4 text-sky-500" />
              พนักงาน
            </Label>
            <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeePickerOpen}
                  disabled={!form.production_id}
                  className="w-full justify-between bg-white/80 font-normal"
                >
                  <span className="truncate">
                    {selectedEmployee?.full_name || (form.production_id ? `ค้นหาพนักงานใน ${selectedProduction?.name}` : "เลือก Production ก่อน")}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder={`ค้นหาชื่อพนักงานใน ${selectedProduction?.name ?? "Production"}...`} />
                  <CommandList>
                    <CommandEmpty>ไม่พบรายชื่อพนักงานใน Production นี้</CommandEmpty>
                    <CommandGroup>
                      {filteredEmployees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={[employee.full_name, employee.employee_code, employee.position]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() => {
                            updateForm("employee_id", employee.id);
                            setEmployeePickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              form.employee_id === employee.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{employee.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {employee.position || employee.employee_code || "-"}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedEmployee ? (
              <div className="flex items-center gap-4 rounded-2xl border bg-white/70 p-4 shadow-sm">
                {selectedEmployee.photo_url ? (
                  <img
                    src={selectedEmployee.photo_url}
                    alt={selectedEmployee.full_name}
                    className="size-24 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <span className="grid size-24 place-items-center rounded-full border-4 border-white bg-slate-100 text-slate-400 shadow-md">
                    <UserRound className="size-9" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{selectedEmployee.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedEmployee.position || selectedEmployee.employee_code || "ไม่มีข้อมูลตำแหน่ง"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wrench className="size-4 text-violet-500" />
              ทักษะ
            </Label>
            <Popover open={skillPickerOpen} onOpenChange={setSkillPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={skillPickerOpen}
                  className="w-full justify-between bg-white/80 font-normal"
                >
                  <span className="truncate">
                    {selectedSkills.length > 0
                      ? `เลือกแล้ว ${selectedSkills.length} ทักษะ`
                      : editingAssessmentId
                        ? "แก้ไขทักษะได้ 1 รายการ"
                        : "เลือกทักษะได้มากกว่า 1 ข้อ"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="max-h-72 overflow-y-auto p-2">
                  {skills.map((skill) => {
                    const checked = form.skill_ids.includes(skill.id);

                    return (
                      <label
                        key={skill.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            if (editingAssessmentId) {
                              setForm((current) => ({ ...current, skill_ids: [skill.id] }));
                              setError("");
                              return;
                            }

                            toggleSkill(skill.id);
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">
                            {skill.skill_name}
                          </span>
                          {skill.skill_code ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {skill.skill_code}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            {selectedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="rounded-full">
                    {skill.skill_name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Gauge className="size-4 text-amber-500" />
              Current Level
            </Label>
            <Select
              value={form.current_level}
              onValueChange={(value) => updateForm("current_level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกระดับปัจจุบัน" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={String(level.value)}>
                    {level.label} - {level.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="size-4 text-rose-500" />
              Target Level
            </Label>
            <Select
              value={form.target_level}
              onValueChange={(value) => updateForm("target_level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกระดับเป้าหมาย" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={String(level.value)}>
                    {level.label} - {level.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessor" className="flex items-center gap-2">
              <UserCheck className="size-4 text-emerald-500" />
              ผู้ประเมิน
            </Label>
            <Popover open={assessorPickerOpen} onOpenChange={setAssessorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="assessor"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={assessorPickerOpen}
                  className="w-full justify-between bg-white/80 font-normal"
                >
                  <span className="truncate">{form.assessor || "ค้นหาผู้ประเมิน"}</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="ค้นหาชื่อผู้ประเมิน..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบหัวหน้าผลิตหรือผู้ช่วยหัวหน้าผลิต</CommandEmpty>
                    <CommandGroup>
                      {assessorOptions.map((assessor) => (
                        <CommandItem
                          key={assessor.id}
                          value={[assessor.full_name, assessor.position, assessor.production_id]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() => {
                            updateForm("assessor", assessor.full_name);
                            setAssessorPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              form.assessor === assessor.full_name ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{assessor.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {assessor.position}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-date" className="flex items-center gap-2">
              <CalendarDays className="size-4 text-teal-500" />
              วันที่ประเมิน
            </Label>
            <Input
              id="assessment-date"
              type="date"
              value={form.assessment_date}
              onChange={(event) => updateForm("assessment_date", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="assessment-remark" className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-slate-500" />
              หมายเหตุ
            </Label>
            <Textarea
              id="assessment-remark"
              value={form.remark}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={saveAssessment}
            disabled={employees.length === 0 || skills.length === 0}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="mr-2 size-4" />
            {editingAssessmentId ? "บันทึกการแก้ไข" : "บันทึกผลประเมิน"}
          </Button>
          {editingAssessmentId ? (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              <X className="mr-2 size-4" />
              ยกเลิกแก้ไข
            </Button>
          ) : null}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
              <Target className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">ผลประเมินล่าสุด</h2>
              <p className="text-sm text-muted-foreground">รายการทั้งหมด {rows.length} รายการ</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Factory className="size-3.5 text-fuchsia-500" />
                เลือกแผนกสำหรับ PDF
              </Label>
              <Select value={reportProductionId} onValueChange={setReportProductionId}>
                <SelectTrigger className="bg-white/80">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PRODUCTIONS}>ทุกแผนก</SelectItem>
                  {productions.map((production) => (
                    <SelectItem key={production.id} value={production.id}>
                      {production.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={downloadProductionPdf}
              disabled={reportRows.length === 0}
              className="bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20"
            >
              <Download className="mr-2 size-4" />
              โหลด PDF ทั้งแผนก
            </Button>
            <Badge className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
              localStorage
            </Badge>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="flex items-center gap-2"><CalendarDays className="size-4 text-teal-500" />วันที่</span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2"><UserRound className="size-4 text-sky-500" />พนักงาน</span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2"><Wrench className="size-4 text-violet-500" />ทักษะ</span>
                </TableHead>
                <TableHead className="text-center">
                  <span className="flex items-center justify-center gap-2"><Gauge className="size-4 text-amber-500" />Current</span>
                </TableHead>
                <TableHead className="text-center">
                  <span className="flex items-center justify-center gap-2"><Target className="size-4 text-rose-500" />Target</span>
                </TableHead>
                <TableHead className="text-center">
                  <span className="flex items-center justify-center gap-2"><Sparkles className="size-4 text-orange-500" />Gap</span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2"><UserCheck className="size-4 text-emerald-500" />ผู้ประเมิน</span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-2"><MessageSquareText className="size-4 text-slate-500" />หมายเหตุ</span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-2"><SlidersHorizontal className="size-4 text-indigo-500" />จัดการ</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    ยังไม่มีผลประเมิน
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.assessment.id}>
                    <TableCell>{row.assessment.assessment_date}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {row.employee.photo_url ? (
                          <img
                            src={row.employee.photo_url}
                            alt={row.employee.full_name}
                            className="size-12 rounded-full border-2 border-white object-cover shadow-sm"
                          />
                        ) : (
                          <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 shadow-sm">
                            <UserRound className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0 truncate">{row.employee.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{row.skill.skill_name}</TableCell>
                    <TableCell className="text-center">{row.assessment.current_level}</TableCell>
                    <TableCell className="text-center">{row.assessment.target_level}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          row.gap > 0
                            ? "rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white"
                            : "rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                        }
                      >
                        {row.gap}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.assessment.assessor || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.assessment.remark || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                          onClick={() => downloadEmployeePdf(row.employee.id)}
                        >
                          <Download className="mr-1 size-3.5" />
                          PDF
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editAssessment(row.assessment)}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => deleteAssessment(row.assessment.id)}
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






