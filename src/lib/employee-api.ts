import { EMPLOYEE_POSITIONS_2026 } from "@/lib/employee-position-seed";
import type { Employee } from "@/lib/skill-matrix";

export const EMPLOYEE_API_URL = "https://n8n-plant.icpladda.com/webhook/api/employee";

type EmployeeApiRecord = Record<string, unknown>;

const EXCEL_POSITION_BY_NAME = new Map(
  EMPLOYEE_POSITIONS_2026.map((employee) => [employee.nameKey, employee]),
);

const PRODUCTION_ID_BY_CODE: Record<string, string> = {
  P01: "production-p1",
  P1: "production-p1",
  "1": "production-p1",
  P02: "production-p2",
  P2: "production-p2",
  "2": "production-p2",
  P03: "production-p3",
  P3: "production-p3",
  "3": "production-p3",
  P04: "production-p4",
  P4: "production-p4",
  "4": "production-p4",
  P05: "production-p5",
  P5: "production-p5",
  "5": "production-p5",
  LDI: "production-ldi",
  อินเตอร์เทรด: "production-ldi",
};

function pickString(record: EmployeeApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function pickNumber(record: EmployeeApiRecord, keys: string[], fallback: number) {
  const text = pickString(record, keys);
  const match = text.match(/\d+/);
  if (!match) return fallback;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeEmployeeName(value: string) {
  let normalized = value.trim().replace(/\s+/g, "").replace(/\./g, "");
  for (const prefix of ["นางสาว", "นส", "น.ส", "นาย", "นาง"]) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }
  return normalized;
}

function excelPositionForName(fullName: string) {
  return EXCEL_POSITION_BY_NAME.get(normalizeEmployeeName(fullName));
}

function normalizeProductionId(value: string) {
  const upperValue = value.toUpperCase();
  const productionNumber = upperValue.match(/(?:P|PRODUCTION|ผลิต)\s*0?([1-5])/i)?.[1];
  if (productionNumber) return PRODUCTION_ID_BY_CODE[productionNumber] ?? null;
  if (/LDI|อินเตอร์เทรด/i.test(value)) return "production-ldi";

  const normalized = upperValue.replace(/PRODUCTION|ผลิต|แผนก|\s|-/g, "");
  return PRODUCTION_ID_BY_CODE[normalized] ?? null;
}

function productionFromRecord(record: EmployeeApiRecord, employeeCode: string, position: string) {
  const productionText = pickString(record, [
    "production_id",
    "production",
    "production_name",
    "sheet",
    "department",
    "division",
    "section",
    "แผนก",
    "ฝ่าย",
    "ผลิต",
    "ชีท",
    "Sheet",
  ]);
  const searchText = [productionText, employeeCode, position].filter(Boolean).join(" ");

  return normalizeProductionId(searchText);
}

function isRecord(value: unknown): value is EmployeeApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractRecords(payload: unknown): EmployeeApiRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  for (const key of ["data", "items", "employees", "result", "rows"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }

  return [];
}

export function normalizeApiEmployees(payload: unknown): Employee[] {
  return extractRecords(payload)
    .map((record, index): Employee | null => {
      const employeeCode = pickString(record, [
        "employee_code",
        "employeeCode",
        "code",
        "รหัสพนักงาน",
        "รหัส",
        "เลขที่",
        "no",
      ]);
      const fullName = pickString(record, [
        "full_name",
        "fullName",
        "name",
        "employee_name",
        "ชื่อ-นามสกุล",
        "ชื่อ นามสกุล",
        "ชื่อพนักงาน",
        "ชื่อ",
      ]);

      if (!fullName) return null;

      const apiPosition = pickString(record, ["position", "job", "ตำแหน่ง", "หน้าที่"]);
      const excelPosition = excelPositionForName(fullName);
      const position = excelPosition?.position || apiPosition;
      const productionId = productionFromRecord(record, employeeCode, position);
      const competencyLevel = Math.min(
        5,
        pickNumber(
          record,
          ["competency_level", "level", "jb", "JB", "ระดับ", "ระดับความสามารถ"],
          1,
        ),
      );

      return {
        id: pickString(record, ["id", "employee_id", "employeeId"]) || `employee-api-${index + 1}`,
        employee_code: employeeCode || null,
        full_name: fullName,
        position,
        production_id: productionId,
        start_work_date:
          pickString(record, [
            "start_work_date",
            "startDate",
            "hire_date",
            "วันที่เริ่มงาน",
            "วันเริ่มงาน",
          ]) || null,
        jd_training_passed: pickString(record, ["jd_training_passed", "ผ่านอบรม JD", "JD"]) === "/",
        wi_training_passed: pickString(record, ["wi_training_passed", "ผ่านอบรม WI", "WI"]) === "/",
        competency_level: competencyLevel,
        status: pickString(record, ["status", "สถานะ"]) || "ปฏิบัติงาน",
        remark:
          pickString(record, ["remark", "note", "หมายเหตุ"]) ||
          (excelPosition ? `ตำแหน่งจากไฟล์แนบ | Sheet: ${excelPosition.sheet}` : null),
      };
    })
    .filter((employee): employee is Employee => Boolean(employee))
    .sort((firstEmployee, secondEmployee) =>
      firstEmployee.full_name.localeCompare(secondEmployee.full_name, "th"),
    );
}

export async function getApiEmployees() {
  const response = await fetch(EMPLOYEE_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Employee API error: ${response.status}`);

  return normalizeApiEmployees(await response.json());
}
