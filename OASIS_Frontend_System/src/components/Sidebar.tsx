import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users2, ShoppingCart, Hammer, Smartphone,
  ChevronLeft, ChevronRight, HelpCircle, Calculator, Shield, Settings, Layers, Banknote, Sliders, Receipt, CreditCard
} from "lucide-react";
import { Tenant, User as UserType } from "../types";
import { getTenantDepartmentsApi } from "../api";
import { ROUTES } from "../router/routeConfig";

interface SidebarProps {
  pendingApprovalsCount: number;
  currentTenant: Tenant;
  currentUser: UserType;
}

const getCompanyLogoUrl = (logoText?: string) => {
  if (!logoText) return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80";
  const code = logoText.toUpperCase();
  if (logoText.startsWith("http")) return logoText;
  if (code === "GV") return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80";
  if (code === "TL") return "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=80&auto=format&fit=crop&q=80";
  return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80";
};

export default function Sidebar({ pendingApprovalsCount, currentTenant, currentUser }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const isUserAdminDN = currentUser && (
      currentUser.role === "ADMIN_DN" ||
      currentUser.role.toUpperCase().includes("QUẢN TRỊ DOANH NGHIỆP")
    );
    if (isUserAdminDN) {
      getTenantDepartmentsApi()
        .then((res) => { if (res.data) setDepartments(res.data); })
        .catch((err) => console.error("Lỗi lấy danh mục phòng ban:", err));
    }
  }, [currentUser]);

  const role = currentUser ? currentUser.role.toUpperCase() : "";
  const isSuperAdmin =
    role === "SUPER_ADMIN" ||
    role.includes("SUPER_ADMIN") ||
    role.includes("TOÀN BỘ HỆ THỐNG SAAS") ||
    role.includes("QUẢN TRỊ HỆ THỐNG");
  const isBOD =
    role === "BOD / OWNER" || role === "DIRECTOR" ||
    role.includes("CHỦ DOANH NGHIỆP") || role.includes("GIÁM ĐỐC") || role.includes("BOD");
  const isAdminDN = role === "ADMIN_DN" || role.includes("QUẢN TRỊ DOANH NGHIỆP");

  // Menu items tuỳ theo vai trò
  const menuItems = (() => {
    if (isSuperAdmin) {
      return [{ path: ROUTES.SYS_ADMIN, name: "Quản trị hệ thống SaaS", shortName: "SaaS Admin", icon: Shield, badge: null, description: "Đăng ký doanh nghiệp và cấp tài khoản quản trị" }];
    }
    if (isAdminDN) {
      return [
        { path: ROUTES.ADMIN_DASHBOARD, name: "Tổng quan Dashboard", shortName: "Dashboard", icon: LayoutDashboard, badge: null, description: "" },
        { path: ROUTES.ADMIN_ACCOUNTS, name: "Nhân sự & Tài khoản", shortName: "Nhân sự", icon: Users2, badge: null, description: "" },
        { path: ROUTES.ADMIN_SETTINGS, name: "Thiết lập doanh nghiệp", shortName: "Cài đặt", icon: Settings, badge: null, description: "" },
      ];
    }
    if (isBOD) {
      return [
        { path: ROUTES.BOD_DASHBOARD, name: "Dashboard", shortName: "CEO Dashboard", icon: LayoutDashboard, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null, badgeColor: "bg-terracotta text-white", description: "Duyệt nhanh và quản trị tài chính doanh nghiệp" },
        { path: ROUTES.BOD_FINANCE, name: "Tài Chính & Quỹ Lương", shortName: "Tài chính", icon: Banknote, badge: null, description: "Radar sức khỏe tài chính & Duyệt quỹ lương chi ngân hàng" },
        { path: ROUTES.BOD_HRM, name: "Phòng Nhân Sự (HRM)", shortName: "Nhân sự", icon: Users2, badge: null, description: "Quản lý hồ sơ nhân sự, soạn thảo ký kết HĐLD" },
        { path: ROUTES.BOD_SALES, name: "Đơn Hàng & Công Nợ", shortName: "Kinh doanh", icon: ShoppingCart, badge: null, description: "Lập đơn hàng bán, kiểm duyệt ngưỡng thanh toán" },
        { path: ROUTES.BOD_PRODUCTION, name: "Phòng Sản Xuất (BOD)", shortName: "Sản xuất", icon: Hammer, badge: null, description: "Giám sát tiến độ công đoạn, Bottleneck Radar & Duyệt kế hoạch vật tư" },
        { path: ROUTES.BOD_SETTINGS, name: "Cấu Hình & Audit Logs", shortName: "Cấu hình & Log", icon: Sliders, badge: null, description: "Nhật ký duyệt, cài đặt ngưỡng rủi ro & ủy quyền tạm thời" },
      ];
    }
    if (role === "HR MANAGER" || role === "HR_STAFF" || role.includes("NHÂN SỰ") || role.includes("HR")) {
      return [{ path: ROUTES.HR_HRM, name: "Phòng Nhân Sự (HRM)", shortName: "Nhân sự", icon: Users2, badge: null, description: "Quản lý hồ sơ nhân sự, soạn thảo ký kết HĐLD" }];
    }
    if (role === "SALES STAFF" || role === "SALES_STAFF" || role.includes("KINH DOANH") || role.includes("SALES")) {
      return [{ path: ROUTES.SALES_ORDERS, name: "Đơn Hàng & Công Nợ", shortName: "Kinh doanh", icon: ShoppingCart, badge: null, description: "Lập đơn hàng bán, kiểm duyệt ngưỡng thanh toán" }];
    }
    if (role === "ACCOUNTANT" || role === "ACCOUNTANT_STAFF" || role === "AD" || role.includes("KẾ TOÁN")) {
      return [
        { path: ROUTES.ACCOUNTANT_PRODUCTION_PAYROLL, name: "Lương Sản Xuất", shortName: "Lương SX", icon: Layers, badge: null, description: "Quản lý lương thợ sản phẩm & lương công ngày" },
        { path: ROUTES.ACCOUNTANT_OFFICE_PAYROLL, name: "Lương Văn Phòng", shortName: "Lương VP", icon: Users2, badge: null, description: "Quản lý lương cố định, OT & phạt đi muộn" },
        { path: ROUTES.ACCOUNTANT_VOUCHERS, name: "Thu - Chi & Dòng Tiền", shortName: "Thu Chi", icon: Receipt, badge: null, description: "Quản lý chứng từ phiếu thu cọc & phiếu chi" },
        { path: ROUTES.ACCOUNTANT_DEBTS, name: "Công Nợ Đợt", shortName: "Công Nợ", icon: CreditCard, badge: null, description: "Đối soát thu nợ đơn hàng & nợ nhà cung cấp" },
      ];
    }
    if (role === "PRODUCTION WORKER" || role === "WORKER" || role === "PRODUCTION_STAFF" || role.includes("SẢN XUẤT") || role.includes("CÔNG NHÂN")) {
      return [
        { path: ROUTES.PRODUCTION_PLANS, name: "Sản Xuất & Định Mức BOM", shortName: "QL Sản xuất", icon: Hammer, badge: null, description: "Cấu hình BOM nguyên vật liệu và lập kế hoạch" },
        { path: ROUTES.WORKER_PORTAL, name: "Worker Mobile Portal", shortName: "Cổng Công nhân", icon: Smartphone, badge: null, description: "Giao diện di động cho thợ tại phân xưởng" },
      ];
    }
    return [];
  })();

  const isActive = (path: string) => {
    if (path === ROUTES.ADMIN_ACCOUNTS) {
      return currentPath === path || currentPath.startsWith("/admin/accounts/dept/");
    }
    return currentPath === path;
  };

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out relative shadow-sm h-[calc(100vh-64px)] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      id="enterprise-sidebar"
    >
      {/* Nút thu gọn sidebar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10 cursor-pointer"
        title={isCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {isCollapsed
          ? <ChevronRight className="w-3 h-3 text-slate-500" />
          : <ChevronLeft className="w-3 h-3 text-slate-500" />
        }
      </button>

      {/* Upper Navigation List */}
      <div className="py-4 flex-1 flex flex-col justify-start">
        {/* Logo doanh nghiệp */}
        {!isSuperAdmin && (
          <div className="px-4 mb-4 flex items-center gap-2">
            {!isCollapsed ? (
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <img
                  src={getCompanyLogoUrl(currentTenant.logo)}
                  alt={currentTenant.name}
                  className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0 select-none border border-slate-100"
                />
                <div className="text-left truncate ml-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Doanh nghiệp</div>
                  <div className="text-[15px] font-bold text-slate-800 truncate mt-1" title={currentTenant.name}>
                    {currentTenant.name}
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={getCompanyLogoUrl(currentTenant.logo)}
                alt={currentTenant.name}
                className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0 select-none border border-slate-100"
              />
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <div className="px-2 space-y-1.5">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full group relative flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                    active
                      ? "bg-slate-teal-light shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  id={`sidebar-tab-${item.path.replace(/\//g, "-").slice(1)}`}
                  title={item.name}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="p-1 transition-colors shrink-0 bg-transparent">
                      <IconComponent className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-slate-teal" : "text-slate-400 group-hover:text-slate-600"}`} />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left truncate">
                        <span
                          className="block text-[14px]"
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: active ? 700 : 500,
                            color: active ? "var(--color-slate-teal)" : "#475569",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  {"badge" in item && item.badge !== null && item.badge !== undefined && !isCollapsed && (
                    <span className={`text-[9px] font-black min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full shrink-0 shadow-sm ${"badgeColor" in item ? item.badgeColor : ""}`}>
                      {item.badge}
                    </span>
                  )}
                  {"badge" in item && item.badge !== null && item.badge !== undefined && isCollapsed && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-terracotta border border-white" />
                  )}
                </button>
              );
            })}

            {/* Nhóm phòng ban lọc nhanh cho Admin DN */}
            {isAdminDN && !isCollapsed && departments.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div
                  className="px-3 mb-2 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider text-left"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Lọc theo Phòng ban
                </div>
                <div className="space-y-1">
                  {departments.map((dept) => {
                    const deptPath = `/admin/accounts/dept/${dept.id}`;
                    const active = currentPath === deptPath;
                    return (
                      <button
                        key={dept.id}
                        onClick={() => navigate(deptPath)}
                        className={`w-full flex items-center space-x-3 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          active
                            ? "bg-slate-50 text-blue-950 font-bold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <Layers className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-950" : "text-slate-400"}`} />
                        <span
                          className="text-[11.5px] truncate text-left"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {dept.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-50 flex items-center justify-center">
        <div
          className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all py-1.5"
          title="Hỗ trợ Multi-tenant độc lập dữ liệu & phân vai trò quản trị"
        >
          <HelpCircle className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && (
            <span
              className="text-[10px] font-semibold ml-2 text-slate-500 whitespace-nowrap"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Mô hình ERP SaaS
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
