// All users are admin — no role-based restrictions
export const can = {
  manageStaff: () => true,
  manageDepartments: () => true,
  bookBed: () => true,
  createReferral: () => true,
  viewAuditLog: () => true,
  checkInOut: () => true,
}
