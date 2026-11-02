export const ASSIGNABLE_STAFF_ROLES = [
  "admin",
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

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}
