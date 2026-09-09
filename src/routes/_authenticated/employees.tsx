import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Factory,
  Hash,
  ImagePlus,
  Medal,
  MessageSquareText,
  Plus,
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
import {
  type Employee,
  competencyName,
  useEmployees,
  useProductions,
} from "@/lib/skill-matrix";
import { saveLocalEmployees } from "@/lib/skill-matrix-storage";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "ข้อมูลพนักงาน | SKILL MATRIX" },
      {
        name: "description",
        content: "จัดการข้อมูลพนักงานด้วย localStorage ก่อนเชื่อมต่อฐานข้อมูลจริง",
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

function CheckMark({ checked }: { checked?: boolean }) {
  return checked ? <ClipboardCheck className="mx-auto size-4 text-emerald-600" /> : <span>-</span>;
}

function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const productionName = (id: string | null) => productions.find((p) => p.id === id)?.name ?? "-";

  const selectedProductionEmployees = useMemo(() => {
    if (!form.production_id) return [];
    if (form.production_id === "none") return employees.filter((employee) => !employee.production_id);

    return employees.filter((employee) => employee.production_id === form.production_id);
  }, [employees, form.production_id]);

  const selectedProductionName =
    form.production_id === "none" ? "ไม่ระบุ Production" : productionName(form.production_id || null);
  function updateProduction(value: string) {
    setForm((current) => ({
      ...current,
      production_id: value,
    }));
  }

  function updateField(field: keyof EmployeeForm, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = form.full_name.trim();
    if (!fullName) return;

    const newEmployee: Employee = {
      id: `local-employee-${Date.now()}`,
      photo_url: form.photo_url || null,
      employee_code: form.employee_code.trim() || null,
      full_name: fullName,
      position: form.position.trim(),
      production_id: form.production_id && form.production_id !== "none" ? form.production_id : null,
      start_work_date: form.start_work_date || null,
      jd_training_passed: form.jd_training_passed,
      wi_training_passed: form.wi_training_passed,
      competency_level: Number(form.competency_level),
      status: "active",
      remark: form.remark.trim() || null,
    };

    saveLocalEmployees([...employees.filter((employee) => employee.id.startsWith("local-employee-")), newEmployee]);
    setForm({ ...EMPTY_FORM, production_id: newEmployee.production_id ?? "" });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  }

  return (
    <AppShell
      title="ข้อมูลพนักงาน"
      description="ดูรายชื่อพนักงานจากไฟล์แนบปี 2026 เท่านั้น"
    >
      <form className="panel overflow-hidden p-5" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Plus className="size-5" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <Plus className="size-5 text-fuchsia-500" />
                เพิ่มพนักงาน
              </h2>
              <p className="text-sm text-muted-foreground">รายการพนักงานหลักดึงจากไฟล์แนบปี 2026</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              ข้อมูลหลักจากไฟล์แนบ 2026
            </Badge>
            <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white" disabled={!form.full_name.trim()}>
              <Plus className="mr-2 size-4" />
              เพิ่มพนักงาน
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="employee-photo" className="flex items-center gap-2">
              <ImagePlus className="size-4 text-pink-500" />
              แนบรูปพนักงาน
            </Label>
            <Input id="employee-photo" type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} />
            {form.photo_url ? (
              <img src={form.photo_url} alt="รูปพนักงาน" className="size-20 rounded-2xl border object-cover shadow-sm" />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-code" className="flex items-center gap-2">
              <Hash className="size-4 text-violet-500" />
              รหัสพนักงาน
            </Label>
            <Input id="employee-code" value={form.employee_code} onChange={(event) => updateField("employee_code", event.target.value)} placeholder="เช่น EMP001" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-name" className="flex items-center gap-2">
              <UserRound className="size-4 text-sky-500" />
              ชื่อ-นามสกุล
            </Label>
            <Input id="employee-name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} placeholder="ค้นหาข้อมูลพนักงาน" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-position" className="flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-amber-500" />
              ตำแหน่ง
            </Label>
            <Input id="employee-position" value={form.position} onChange={(event) => updateField("position", event.target.value)} placeholder="เช่น Operator" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="production-filter" className="flex items-center gap-2">
              <Factory className="size-4 text-fuchsia-500" />
              Production
            </Label>
            <Select value={form.production_id} onValueChange={updateProduction}>
              <SelectTrigger id="production-filter">
                <SelectValue placeholder="ไม่ระบุ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {productions.map((production) => (
                  <SelectItem key={production.id} value={production.id}>
                    {production.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency-level" className="flex items-center gap-2">
              <Medal className="size-4 text-orange-500" />
              ระดับความสามารถ
            </Label>
            <Select value={form.competency_level} onValueChange={(value) => updateField("competency_level", value)}>
              <SelectTrigger id="competency-level">
                <SelectValue placeholder="1 - Beginner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Beginner</SelectItem>
                <SelectItem value="2">2 - Basic</SelectItem>
                <SelectItem value="3">3 - Skillful</SelectItem>
                <SelectItem value="4">4 - Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-work-date" className="flex items-center gap-2">
              <CalendarDays className="size-4 text-teal-500" />
              วันที่เริ่มงาน
            </Label>
            <Input id="start-work-date" type="date" value={form.start_work_date} onChange={(event) => updateField("start_work_date", event.target.value)} />
          </div>

          <div className="space-y-3 rounded-2xl bg-white/60 p-4 shadow-inner md:col-span-1">
            <Label className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-emerald-500" />
              ผ่านอบรม
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox id="jd-training" checked={form.jd_training_passed} onCheckedChange={(checked) => updateField("jd_training_passed", checked === true)} />
              <Label htmlFor="jd-training" className="font-normal">ผ่านอบรม JD</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="wi-training" checked={form.wi_training_passed} onCheckedChange={(checked) => updateField("wi_training_passed", checked === true)} />
              <Label htmlFor="wi-training" className="font-normal">ผ่านอบรม WI</Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="employee-remark" className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-slate-500" />
              หมายเหตุ
            </Label>
            <Textarea id="employee-remark" value={form.remark} onChange={(event) => updateField("remark", event.target.value)} placeholder="รายละเอียดเพิ่มเติม" />
          </div>
        </div>
      </form>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/20">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">รายชื่อพนักงาน</h2>
              <p className="text-sm text-muted-foreground">
                {form.production_id
                  ? `${selectedProductionName} ${selectedProductionEmployees.length} คน`
                  : "เลือก Production เพื่อแสดงข้อมูลพนักงาน"}
              </p>
            </div>
          </div>
          <Badge className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
            <BadgeCheck className="mr-1 size-3.5" /> ไฟล์แนบ
          </Badge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="flex items-center gap-2">
                    <ImagePlus className="size-4 text-pink-500" />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {!form.production_id ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    เลือก Production ด้านบนเพื่อแสดงข้อมูลพนักงาน
                  </TableCell>
                </TableRow>
              ) : selectedProductionEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    ไม่พบข้อมูลพนักงานใน {selectedProductionName}
                  </TableCell>
                </TableRow>
              ) : (
                selectedProductionEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      {employee.photo_url ? (
                        <img src={employee.photo_url} alt={employee.full_name} className="size-10 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <UserRound className="size-4" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{employee.employee_code || "-"}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{employee.full_name}</TableCell>
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
                    <TableCell className="text-muted-foreground">{employee.remark || "-"}</TableCell>
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
