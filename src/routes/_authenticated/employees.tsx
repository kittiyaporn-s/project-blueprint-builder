import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Check, ChevronsUpDown, Plus, Users } from "lucide-react";
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
import {
  COMPETENCY_LEVELS,
  type Employee,
  competencyName,
  useEmployees,
  useProductions,
} from "@/lib/skill-matrix";
import { getLocalEmployees, saveLocalEmployees } from "@/lib/skill-matrix-storage";
import { cn } from "@/lib/utils";

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
  employee_code: string;
  full_name: string;
  position: string;
  production_id: string;
  competency_level: string;
  status: string;
  remark: string;
};

const EMPTY_FORM: EmployeeForm = {
  employee_code: "",
  full_name: "",
  position: "",
  production_id: "none",
  competency_level: "1",
  status: "ปฏิบัติงาน",
  remark: "",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `employee-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: productions = [] } = useProductions();
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [error, setError] = useState("");

  const productionName = (id: string | null) => productions.find((p) => p.id === id)?.name ?? "-";

  const employeeGroups = useMemo(() => {
    const productionGroups = productions.map((production) => ({
      id: production.id,
      name: production.name,
      employees: employees.filter((employee) => employee.production_id === production.id),
    }));
    const noProductionEmployees = employees.filter((employee) => !employee.production_id);

    return noProductionEmployees.length > 0
      ? [
          ...productionGroups,
          { id: "none", name: "ไม่ระบุ Production", employees: noProductionEmployees },
        ]
      : productionGroups;
  }, [employees, productions]);

  const visibleEmployeeGroups = employeeGroups.filter((group) => group.employees.length > 0);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

  const employeesForSelectedProduction = useMemo(() => {
    return employees.filter((employee) =>
      form.production_id === "none"
        ? !employee.production_id
        : employee.production_id === form.production_id,
    );
  }, [employees, form.production_id]);

  function updateForm(key: keyof EmployeeForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function updateProduction(value: string) {
    setSelectedEmployeeId("");
    setForm((current) => ({
      ...current,
      production_id: value,
      employee_code: "",
      full_name: "",
      position: "",
      competency_level: "1",
      status: "ปฏิบัติงาน",
      remark: "",
    }));
    setError("");
  }

  function selectEmployee(employeeId: string) {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return;

    setSelectedEmployeeId(employeeId);
    setEmployeePickerOpen(false);
    setForm((current) => ({
      ...current,
      employee_code: employee.employee_code ?? "",
      full_name: employee.full_name,
      position: employee.position,
      production_id: employee.production_id ?? "none",
      competency_level: String(employee.competency_level),
      status: employee.status,
      remark: employee.remark ?? "",
    }));
    setError("");
  }

  async function addEmployee() {
    const fullName = form.full_name.trim();
    if (!fullName) {
      setError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }

    const employee: Employee = {
      id: createId(),
      employee_code: form.employee_code.trim() || null,
      full_name: fullName,
      position: form.position.trim(),
      production_id: form.production_id === "none" ? null : form.production_id,
      competency_level: Number(form.competency_level),
      status: form.status.trim() || "ปฏิบัติงาน",
      remark: form.remark.trim() || null,
    };

    saveLocalEmployees([...getLocalEmployees(), employee]);
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
    setForm(EMPTY_FORM);
    setSelectedEmployeeId("");
  }

  return (
    <AppShell
      title="ข้อมูลพนักงาน"
      description="ดูรายชื่อพนักงานจาก API พร้อม fallback localStorage"
    >
      <section className="panel overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Plus className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">เพิ่มพนักงาน</h2>
              <p className="text-sm text-muted-foreground">รายการพนักงานหลักดึงจาก API ของ n8n</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={addEmployee}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"
          >
            <Plus className="mr-2 size-4" />
            เพิ่มพนักงาน
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="employee-code">รหัสพนักงาน</Label>
            <Input
              id="employee-code"
              value={form.employee_code}
              onChange={(event) => updateForm("employee_code", event.target.value)}
              placeholder="เช่น EMP001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-name">ชื่อ-นามสกุล</Label>
            <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="full-name"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeePickerOpen}
                  className="w-full justify-between bg-white/80 font-normal"
                >
                  <span className="truncate">
                    {selectedEmployee?.full_name || "ค้นหาข้อมูลพนักงาน"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="ค้นหาข้อมูลพนักงาน..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบรายชื่อใน Production นี้</CommandEmpty>
                    <CommandGroup>
                      {employeesForSelectedProduction.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={[employee.full_name, employee.employee_code, employee.position]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() => selectEmployee(employee.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0",
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
            <Label htmlFor="position">ตำแหน่ง</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(event) => updateForm("position", event.target.value)}
              placeholder="เช่น Operator"
            />
          </div>
          <div className="space-y-2">
            <Label>Production</Label>
            <Select value={form.production_id} onValueChange={updateProduction}>
              <SelectTrigger>
                <SelectValue placeholder="เลือก Production" />
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
            <Label>ระดับความสามารถ</Label>
            <Select
              value={form.competency_level}
              onValueChange={(value) => updateForm("competency_level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกระดับ" />
              </SelectTrigger>
              <SelectContent>
                {COMPETENCY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={String(level.value)}>
                    {level.value} - {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">สถานะ</Label>
            <Input
              id="status"
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
              placeholder="ปฏิบัติงาน"
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Textarea
              id="remark"
              value={form.remark}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>
        </div>

        {error ? <p className="mt-5 text-sm font-medium text-destructive">{error}</p> : null}
      </section>

      <section className="panel mt-6 overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/20">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">รายชื่อพนักงาน</h2>
              <p className="text-sm text-muted-foreground">พนักงานทั้งหมด {employees.length} คน</p>
            </div>
          </div>
          <Badge className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
            <BadgeCheck className="mr-1 size-3.5" /> API
          </Badge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {employeeGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Sheet / Production
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-display text-lg font-semibold text-slate-900">{group.name}</p>
                  <p className="text-2xl font-bold text-sky-600">{group.employees.length}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">คน</p>
              </div>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>Production</TableHead>
                <TableHead>ระดับ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    ยังไม่มีข้อมูลพนักงาน เพิ่มจากฟอร์มด้านบนได้เลย
                  </TableCell>
                </TableRow>
              ) : (
                visibleEmployeeGroups.map((group) => (
                  <Fragment key={group.id}>
                    <TableRow
                      key={`${group.id}-header`}
                      className="bg-slate-50/80 hover:bg-slate-50/80"
                    >
                      <TableCell colSpan={7} className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-base font-semibold text-slate-900">
                            {group.name}
                          </span>
                          <Badge variant="secondary" className="rounded-full">
                            {group.employees.length} คน
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.employee_code || "-"}</TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {employee.full_name}
                        </TableCell>
                        <TableCell>{employee.position || "-"}</TableCell>
                        <TableCell>{productionName(employee.production_id)}</TableCell>
                        <TableCell>{competencyName(employee.competency_level)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full">
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.remark || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </AppShell>
  );
}
