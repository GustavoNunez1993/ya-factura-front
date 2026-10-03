import type { Department } from "../types/product";

export interface DepartmentInfo {
  id: Department;
  label: string;
  icon: string;
}

export const departments: DepartmentInfo[] = [
  { id: "damas", label: "Damas", icon: "woman" },
  { id: "caballeros", label: "Caballeros", icon: "man" },
  { id: "ninos", label: "Niños", icon: "child_care" },
  { id: "unisex", label: "Unisex", icon: "groups" },
];
