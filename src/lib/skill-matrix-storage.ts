import type { Assessment, Employee, Production, Skill } from "@/lib/skill-matrix";
import { IMPORTED_EMPLOYEES_2026 } from "@/lib/employee-seed";

const STORAGE_KEYS = {
  productions: "skill-matrix:productions",
  skills: "skill-matrix:skills",
  employees: "skill-matrix:employees",
  assessments: "skill-matrix:assessments",
} as const;

const DEFAULT_PRODUCTIONS: Production[] = [
  {
    id: "production-p1",
    code: "P1",
    name: "Production 1",
    product_types: "ยาน้ำ, ผง, เม็ด, ยาน้ำสารกำจัดแมลง",
    sort_order: 1,
  },
  {
    id: "production-p2",
    code: "P2",
    name: "Production 2",
    product_types: "ยาทรายกำจัดวัชพืช",
    sort_order: 2,
  },
  {
    id: "production-p3",
    code: "P3",
    name: "Production 3",
    product_types: "ยาน้ำ, ผง, เม็ด, ยากำจัดวัชพืช, โรคพืช, สารควบคุมการเจริญเติบโตของพืช",
    sort_order: 3,
  },
  {
    id: "production-p4",
    code: "P4",
    name: "Production 4",
    product_types: "ยาเหยื่อหนู, ยาน้ำปุ๋ยน้ำ, ยายุง",
    sort_order: 4,
  },
  {
    id: "production-p5",
    code: "P5",
    name: "Production 5",
    product_types: "ยาทรายกำจัดแมลง",
    sort_order: 5,
  },
  {
    id: "production-ldi",
    code: "LDI",
    name: "Production LDI",
    product_types: "ยาน้ำ, ผง, เม็ด, ยาน้ำสารกำจัดแมลง, ยากำจัดวัชพืช, โรคพืช",
    sort_order: 6,
  },
];

const DEFAULT_SKILLS: Skill[] = [
  {
    id: "skill-s01",
    skill_code: "S01",
    skill_name: "อ่านออก / เขียนได้",
    skill_category: "พื้นฐาน",
    active_status: true,
    sort_order: 1,
  },
  {
    id: "skill-s02",
    skill_code: "S02",
    skill_name: "สัมผัสกลิ่น มองสี ปกติ",
    skill_category: "พื้นฐาน",
    active_status: true,
    sort_order: 2,
  },
  {
    id: "skill-s03",
    skill_code: "S03",
    skill_name: "ตั้งค่า / ปรับเครื่องยิงสติ๊กเกอร์",
    skill_category: "เครื่องจักร",
    active_status: true,
    sort_order: 3,
  },
  {
    id: "skill-s04",
    skill_code: "S04",
    skill_name: "ตั้งค่า / ปรับเครื่องอินดักชั่น",
    skill_category: "เครื่องจักร",
    active_status: true,
    sort_order: 4,
  },
  {
    id: "skill-s05",
    skill_code: "S05",
    skill_name: "ตั้งค่า / ปรับเครื่องจักร",
    skill_category: "เครื่องจักร",
    active_status: true,
    sort_order: 5,
  },
  {
    id: "skill-s06",
    skill_code: "S06",
    skill_name: "ตั้งค่า / ปรับเครื่องบรรจุ",
    skill_category: "เครื่องจักร",
    active_status: true,
    sort_order: 6,
  },
  {
    id: "skill-s07",
    skill_code: "S07",
    skill_name: "กรองยา",
    skill_category: "ผสม",
    active_status: true,
    sort_order: 7,
  },
  {
    id: "skill-s08",
    skill_code: "S08",
    skill_name: "หัวบรรจุ / บรรจุยา",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 8,
  },
  {
    id: "skill-s09",
    skill_code: "S09",
    skill_name: "คิดคำนวณน้ำหนักก่อนบรรจุ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 9,
  },
  {
    id: "skill-s10",
    skill_code: "S10",
    skill_name: "ปิดฝา",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 10,
  },
  {
    id: "skill-s11",
    skill_code: "S11",
    skill_name: "ติดฉลากแบบมือ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 11,
  },
  {
    id: "skill-s12",
    skill_code: "S12",
    skill_name: "เก็บผลิตภัณฑ์ใส่ภาชนะ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 12,
  },
  {
    id: "skill-s13",
    skill_code: "S13",
    skill_name: "ท้ายไลน์ / ตรวจสอบน้ำหนัก",
    skill_category: "QC",
    active_status: true,
    sort_order: 13,
  },
  {
    id: "skill-s14",
    skill_code: "S14",
    skill_name: "ติดฉลากบนภาชนะ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 14,
  },
  {
    id: "skill-s15",
    skill_code: "S15",
    skill_name: "ขับรถโฟคลิฟท์ได้",
    skill_category: "Support",
    active_status: true,
    sort_order: 15,
  },
  {
    id: "skill-s16",
    skill_code: "S16",
    skill_name: "ซีนภาชนะ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 16,
  },
  {
    id: "skill-s17",
    skill_code: "S17",
    skill_name: "เย็บกระสอบ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 17,
  },
  {
    id: "skill-s18",
    skill_code: "S18",
    skill_name: "เรียงกระสอบ",
    skill_category: "บรรจุ",
    active_status: true,
    sort_order: 18,
  },
];

const DEFAULT_EMPLOYEES: Employee[] = IMPORTED_EMPLOYEES_2026;
const DEFAULT_ASSESSMENTS: Assessment[] = [];

const DATABASE_COLLECTIONS = {
  [STORAGE_KEYS.productions]: "productions",
  [STORAGE_KEYS.skills]: "skills",
  [STORAGE_KEYS.employees]: "employees",
  [STORAGE_KEYS.assessments]: "assessments",
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function syncCollectionToDatabase<T>(key: StorageKey, value: T[]) {
  if (typeof window === "undefined") return;

  window
    .fetch("/api/n8n-mongo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "insert",
        collection: "skill_matrix_sync_events",
        data: {
          collection: DATABASE_COLLECTIONS[key],
          records: value,
          saved_at: new Date().toISOString(),
        },
      }),
    })
    .catch((error: unknown) => {
      console.error("Failed to sync skill matrix data", error);
    });
}

function cloneData<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    const testKey = "skill-matrix:storage-test";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  const storage = browserStorage();
  const fallbackData = cloneData(fallback);
  if (!storage) return fallbackData;

  const stored = storage.getItem(key);
  if (!stored) {
    storage.setItem(key, JSON.stringify(fallbackData));
    return fallbackData;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Stored value is not an array");
    if (parsed.length === 0 && fallbackData.length > 0) {
      storage.setItem(key, JSON.stringify(fallbackData));
      return fallbackData;
    }
    return parsed as T[];
  } catch {
    storage.setItem(key, JSON.stringify(fallbackData));
    return fallbackData;
  }
}

function writeCollection<T>(key: StorageKey, value: T[]) {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
  syncCollectionToDatabase(key, value);
}

export function getLocalProductions(): Production[] {
  return readCollection(STORAGE_KEYS.productions, DEFAULT_PRODUCTIONS).sort(
    (firstProduction, secondProduction) => firstProduction.sort_order - secondProduction.sort_order,
  );
}

export function getLocalSkills(): Skill[] {
  return readCollection(STORAGE_KEYS.skills, DEFAULT_SKILLS).sort(
    (firstSkill, secondSkill) => firstSkill.sort_order - secondSkill.sort_order,
  );
}

export function getLocalEmployees(): Employee[] {
  const storedEmployees = readCollection<Employee>(STORAGE_KEYS.employees, []);
  const employeesById = new Map(DEFAULT_EMPLOYEES.map((employee) => [employee.id, employee]));
  storedEmployees.forEach((employee) => employeesById.set(employee.id, employee));

  return [...employeesById.values()].filter((employee) => employee.status !== "deleted").sort(
    (firstEmployee, secondEmployee) =>
      firstEmployee.full_name.localeCompare(secondEmployee.full_name, "th"),
  );
}

export function getLocalAssessments(): Assessment[] {
  return readCollection(STORAGE_KEYS.assessments, DEFAULT_ASSESSMENTS);
}

export function saveLocalProductions(productions: Production[]) {
  writeCollection(STORAGE_KEYS.productions, productions);
}

export function saveLocalSkills(skills: Skill[]) {
  writeCollection(STORAGE_KEYS.skills, skills);
}

export function saveLocalEmployees(employees: Employee[]) {
  writeCollection(STORAGE_KEYS.employees, employees);
}

export function saveLocalAssessments(assessments: Assessment[]) {
  writeCollection(STORAGE_KEYS.assessments, assessments);
}
