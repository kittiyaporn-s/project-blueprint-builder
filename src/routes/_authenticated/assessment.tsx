import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Check, ChevronsUpDown, ClipboardCheck, Plus, Target } from "lucide-react";
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
  buildGapRows,
  useAssessments,
  useEmployees,
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
  employee_id: string;
  skill_ids: string[];
  current_level: string;
  target_level: string;
  assessor: string;
  assessment_date: string;
  remark: string;
};

const EMPTY_FORM: AssessmentForm = {
  employee_id: "",
  skill_ids: [],
  current_level: "1",
  target_level: "3",
  assessor: "",
  assessment_date: new Date().toISOString().slice(0, 10),
  remark: "",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `assessment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AssessmentPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: skills = [] } = useSkills();
  const { data: assessments = [] } = useAssessments();
  const [form, setForm] = useState<AssessmentForm>(EMPTY_FORM);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [assessorPickerOpen, setAssessorPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const selectedSkills = skills.filter((skill) => form.skill_ids.includes(skill.id));
  const assessorOptions = employees.filter((employee) => {
    const position = (employee.position || "").replace(/\s+/g, "");
    return (
      position.includes("หัวหน้าผลิต") ||
      position.includes("ผู้ช่วยหัวหน้าผลิต") ||
      position.includes("หัวหน้าทีม") ||
      position.includes("ผู้ช่วยหัวหน้าทีม")
    );
  });

  const rows = buildGapRows(employees, skills, assessments).sort(
    (firstRow, secondRow) =>
      secondRow.assessment.assessment_date.localeCompare(firstRow.assessment.assessment_date) ||
      firstRow.employee.full_name.localeCompare(secondRow.employee.full_name, "th"),
  );

  function updateForm(key: keyof AssessmentForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
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
      const existingIndex = nextAssessments.findIndex(
        (assessment) =>
          assessment.employee_id === form.employee_id && assessment.skill_id === skillId,
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
    setForm({ ...EMPTY_FORM, employee_id: form.employee_id });
  }

  return (
    <AppShell title="ประเมินทักษะ" description="บันทึกผลประเมินทักษะด้วย localStorage">
      <section className="panel overflow-hidden p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">บันทึกผลประเมิน</h2>
            <p className="text-sm text-muted-foreground">
              เลือกพนักงานและทักษะ ถ้ามีรายการเดิม ระบบจะอัปเดตทับให้อัตโนมัติ
            </p>
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
            <Label>พนักงาน</Label>
            <Select
              value={form.employee_id}
              onValueChange={(value) => updateForm("employee_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกพนักงาน" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ทักษะ</Label>
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
                        <Checkbox checked={checked} onCheckedChange={() => toggleSkill(skill.id)} />
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
            <Label>Current Level</Label>
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
            <Label>Target Level</Label>
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
            <Label htmlFor="assessor">ผู้ประเมิน</Label>
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
                      {assessorOptions.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={[employee.full_name, employee.position, employee.production_id]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() => {
                            updateForm("assessor", employee.full_name);
                            setAssessorPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              form.assessor === employee.full_name ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{employee.full_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {employee.position || "-"}
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
            <Label htmlFor="assessment-date">วันที่ประเมิน</Label>
            <Input
              id="assessment-date"
              type="date"
              value={form.assessment_date}
              onChange={(event) => updateForm("assessment_date", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="assessment-remark">หมายเหตุ</Label>
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
            บันทึกผลประเมิน
          </Button>
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
              <Target className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">ผลประเมินล่าสุด</h2>
              <p className="text-sm text-muted-foreground">รายการทั้งหมด {rows.length} รายการ</p>
            </div>
          </div>
          <Badge className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
            localStorage
          </Badge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>พนักงาน</TableHead>
                <TableHead>ทักษะ</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">Target</TableHead>
                <TableHead className="text-center">Gap</TableHead>
                <TableHead>ผู้ประเมิน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    ยังไม่มีผลประเมิน
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.assessment.id}>
                    <TableCell>{row.assessment.assessment_date}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {row.employee.full_name}
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
