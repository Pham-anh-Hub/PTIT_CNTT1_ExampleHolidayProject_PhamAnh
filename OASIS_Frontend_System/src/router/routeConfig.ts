/**
 * routeConfig.ts — Cấu hình trung tâm cho tất cả URL routes theo vai trò.
 * Thay đổi đường dẫn ở đây sẽ tự động cập nhật toàn bộ ứng dụng.
 */

export const ROUTES = {
  LOGIN: "/login",

  // Ban Giám Đốc / Chủ doanh nghiệp (BOD / OWNER / DIRECTOR)
  BOD_DASHBOARD: "/bod/dashboard",
  BOD_HRM: "/bod/hrm",
  BOD_SALES: "/bod/sales",
  BOD_FINANCE: "/bod/finance",
  BOD_PRODUCTION: "/bod/production",
  BOD_SETTINGS: "/bod/settings",

  // Phòng Nhân Sự (HR)
  HR_HRM: "/hr/hrm",

  // Phòng Kinh Doanh (Sales)
  SALES_ORDERS: "/sales/orders",

  // Phòng Sản Xuất (Production)
  PRODUCTION_PLANS: "/production/plans",

  // Kế Toán (Accountant)
  ACCOUNTANT_FINANCE: "/accountant/finance",

  // Công Nhân (Worker)
  WORKER_PORTAL: "/worker/portal",

  // Quản Trị Hệ Thống SaaS (Super Admin)
  SYS_ADMIN: "/sys-admin",
  SYS_ADMIN_TENANT: "/sys-admin/tenant/:tenantId",

  // Quản Trị Doanh Nghiệp (Admin DN)
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_ACCOUNTS: "/admin/accounts",
  ADMIN_ACCOUNTS_DEPT: "/admin/accounts/dept/:deptId",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

/**
 * Trả về URL mặc định khi người dùng đăng nhập, dựa theo vai trò.
 * Đây là phiên bản URL-based thay thế cho getDefaultTabForRole() trong App.tsx.
 */
export function getDefaultRouteForRole(role: string): string {
  const r = role.toUpperCase();

  if (
    r === "SUPER_ADMIN" ||
    r.includes("SUPER_ADMIN") ||
    r.includes("TOÀN BỘ HỆ THỐNG SAAS") ||
    r.includes("QUẢN TRỊ HỆ THỐNG")
  ) {
    return ROUTES.SYS_ADMIN;
  }

  if (r === "ADMIN_DN" || r.includes("QUẢN TRỊ DOANH NGHIỆP")) {
    return ROUTES.ADMIN_DASHBOARD;
  }

  if (
    r === "BOD / OWNER" ||
    r === "DIRECTOR" ||
    r.includes("CHỦ DOANH NGHIỆP") ||
    r.includes("GIÁM ĐỐC") ||
    r.includes("BOD")
  ) {
    return ROUTES.BOD_DASHBOARD;
  }

  if (
    r === "HR MANAGER" ||
    r === "HR_STAFF" ||
    r.includes("NHÂN SỰ") ||
    r.includes("HR")
  ) {
    return ROUTES.HR_HRM;
  }

  if (
    r === "SALES STAFF" ||
    r === "SALES_STAFF" ||
    r.includes("KINH DOANH") ||
    r.includes("SALES")
  ) {
    return ROUTES.SALES_ORDERS;
  }

  if (
    r === "ACCOUNTANT" ||
    r === "ACCOUNTANT_STAFF" ||
    r === "AD" ||
    r.includes("KẾ TOÁN")
  ) {
    return ROUTES.ACCOUNTANT_FINANCE;
  }

  if (
    r === "PRODUCTION WORKER" ||
    r === "WORKER" ||
    r === "PRODUCTION_STAFF" ||
    r.includes("SẢN XUẤT") ||
    r.includes("CÔNG NHÂN")
  ) {
    return ROUTES.WORKER_PORTAL;
  }

  // Fallback
  return ROUTES.BOD_DASHBOARD;
}

/** Kiểm tra nhanh xem role có phải BOD không (dùng nhiều nơi) */
export function isBodRole(role: string): boolean {
  const r = role.toUpperCase();
  return (
    r === "BOD / OWNER" ||
    r === "DIRECTOR" ||
    r === "ADMIN_DN" ||
    r.includes("CHỦ DOANH NGHIỆP") ||
    r.includes("GIÁM ĐỐC") ||
    r.includes("BOD")
  );
}

/** Kiểm tra nhanh xem role có phải Super Admin không */
export function isSuperAdminRole(role: string): boolean {
  const r = role.toUpperCase();
  return (
    r === "SUPER_ADMIN" ||
    r.includes("SUPER_ADMIN") ||
    r.includes("TOÀN BỘ HỆ THỐNG SAAS") ||
    r.includes("QUẢN TRỊ HỆ THỐNG")
  );
}
