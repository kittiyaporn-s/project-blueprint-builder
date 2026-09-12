import { useQuery } from "@tanstack/react-query";
import {
  getLocalAssessments,
  getLocalEmployees,
  getLocalProductions,
  getLocalSkills,
} from "@/lib/skill-matrix-storage";

export type Production = {
  id: string;
  code: string;
  name: string;
  product_types: string | null;
  sort_order: number;
};

export type Employee = {
  id: string;
  photo_url?: string | null;
  employee_code: string | null;
  full_name: string;
  position: string;
  production_id: string | null;
  start_work_date?: string | null;
  jd_training_passed?: boolean;
  wi_training_passed?: boolean;
  competency_level: number;
  status: string;
  remark: string | null;
};

export type Skill = {
  id: string;
  skill_code: string | null;
  skill_name: string;
  skill_category: string;
  active_status: boolean;
  sort_order: number;
};

export type Assessment = {
  id: string;
  employee_id: string;
  skill_id: string;
  current_level: number;
  target_level: number;
  assessor: string | null;
  assessment_date: string;
  remark: string | null;
};

export const COMPETENCY_LEVELS = [
  { value: 1, name: "เริ่มต้น", desc: "ยังไม่สามารถทำงานได้ ต้องฝึกฝน" },
  { value: 2, name: "พื้นฐาน", desc: "ทำงานได้ด้วยคำแนะนำอย่างใกล้ชิด" },
  { value: 3, name: "ชำนาญ", desc: "ทำงานได้ด้วยตัวเองอย่างถูกต้อง" },
  { value: 4, name: "ผู้เชี่ยวชาญ", desc: "ทำงานได้อย่างคล่องแคล่ว แก้ไขปัญหาได้" },
  { value: 5, name: "ผู้ชำนาญการสูง", desc: "เชี่ยวชาญมาก สอนผู้อื่นได้ / ปรับปรุง / พัฒนาได้" },
];

export const SKILL_LEVELS = [
  { value: 1, label: "Level 1", desc: "ยังไม่เคยทำ / ต้องสอน" },
  { value: 2, label: "Level 2", desc: "ทำได้ แต่ต้องมีผู้ควบคุม" },
  { value: 3, label: "Level 3", desc: "ทำได้ด้วยตัวเอง" },
  { value: 4, label: "Level 4", desc: "เชี่ยวชาญ / สามารถสอนคนอื่นได้" },
];

export function competencyName(level: number) {
  return COMPETENCY_LEVELS.find((l) => l.value === level)?.name ?? "-";
}

export function useProductions() {
  return useQuery({
    queryKey: ["productions"],
    queryFn: async (): Promise<Production[]> => {
      return getLocalProductions();
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async (): Promise<Skill[]> => {
      return getLocalSkills();
    },
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<Employee[]> => {
      return getLocalEmployees();
    },
  });
}

export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: async (): Promise<Assessment[]> => {
      return getLocalAssessments();
    },
  });
}

export type GapRow = {
  employee: Employee;
  skill: Skill;
  assessment: Assessment;
  gap: number;
};

export function buildGapRows(
  employees: Employee[],
  skills: Skill[],
  assessments: Assessment[],
): GapRow[] {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const rows: GapRow[] = [];
  for (const a of assessments) {
    const employee = empById.get(a.employee_id);
    const skill = skillById.get(a.skill_id);
    if (!employee || !skill) continue;
    rows.push({ employee, skill, assessment: a, gap: a.target_level - a.current_level });
  }
  return rows;
}
