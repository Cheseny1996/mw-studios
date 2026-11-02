export const ASSIGNABLE_STAFF_ROLES = [
  "admin",
  "department_admin",
  "content_editor",
  "event_manager",
  "communications",
  "hr_manager",
  "election_manager",
  "shop_manager",
  "finance_manager",
] as const;

export const STAFF_ROLES = ["super_admin", ...ASSIGNABLE_STAFF_ROLES] as const;

export const STAFF_DEPARTMENTS = [
  "hr",
  "creative",
  "production",
  "communications",
  "events",
  "technology",
  "elections",
  "shop",
  "finance",
  "other",
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];
export type StaffSection = "posts" | "events" | "opportunities" | "jishindie" | "shop";

const DEPARTMENT_SECTIONS: Partial<Record<StaffDepartment, readonly StaffSection[]>> = {
  creative: ["posts", "opportunities"],
  production: ["events"],
  communications: ["posts", "events"],
  hr: ["opportunities"],
  events: ["events"],
  elections: ["jishindie"],
  shop: ["shop"],
};

export const DEPARTMENT_STAFF_ROLES: Record<Exclude<StaffDepartment, "other">, readonly AssignableStaffRole[]> = {
  hr: ["hr_manager"],
  creative: ["content_editor", "communications"],
  production: ["event_manager", "content_editor"],
  communications: ["communications", "content_editor"],
  events: ["event_manager"],
  technology: ["content_editor"],
  elections: ["election_manager"],
  shop: ["shop_manager"],
  finance: ["finance_manager"],
};

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function canManageStaffSection(role: string, department: string, section: StaffSection) {
  if (role === "super_admin" || role === "admin") return true;
  const departmentValue = department as StaffDepartment;
  if (role === "department_admin") return DEPARTMENT_SECTIONS[departmentValue]?.includes(section) === true;
  if (role === "content_editor") {
    return section === "posts"
      ? ["creative", "production", "communications", "technology"].includes(department)
      : section === "opportunities" && departmentValue === "creative";
  }
  if (role === "communications") {
    return section === "posts"
      ? ["creative", "communications"].includes(department)
      : section === "events" && departmentValue === "communications";
  }
  if (role === "event_manager") {
    return section === "events" && ["production", "events"].includes(department);
  }
  if (role === "hr_manager") return section === "opportunities" && departmentValue === "hr";
  if (role === "election_manager") return section === "jishindie" && departmentValue === "elections";
  if (role === "shop_manager") return section === "shop" && departmentValue === "shop";
  return false;
}
