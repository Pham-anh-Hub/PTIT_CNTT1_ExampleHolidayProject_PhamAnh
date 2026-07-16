import { useState, useEffect, useTransition } from "react";
import { LayoutDashboard, Users2, ShoppingCart, Hammer, Smartphone, ChevronLeft, ChevronRight, HelpCircle, Calculator, Shield, Settings, Layers } from "lucide-react";
import { Tenant, User as UserType } from "../types";
import { getTenantDepartmentsApi } from "../api";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingApprovalsCount: number;
  currentTenant: Tenant;
  currentUser: UserType;
}

const getCompanyLogoUrl = (logoText?: string) => {
  if (!logoText) return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80"; // Fallback logo placeholder
  const code = logoText.toUpperCase();
  if (logoText.startsWith("http")) return logoText;
  if (code === "GV") {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80"; // GoViet logo placeholder
  }
  if (code === "TL") {
    return "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=80&auto=format&fit=crop&q=80"; // ThangLong logo placeholder
  }
  return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80"; // Fallback logo placeholder
};

export default function Sidebar({ activeTab, onTabChange, pendingApprovalsCount, currentTenant, currentUser }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, startTransition] = useTransition();
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const isUserAdminDN = currentUser && (
      currentUser.role === "ADMIN_DN" || 
      currentUser.role.toUpperCase().includes("QUẢN TRỊ DOANH NGHIỆP")
    );
    if (isUserAdminDN) {
      getTenantDepartmentsApi()
        .then((res) => {
          if (res.data) {
            setDepartments(res.data);
          }
        })
        .catch((err) => {
          console.error("Lỗi lấy danh mục phòng ban cho Sidebar:", err);
        });
    }
  }, [currentUser]);

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard Ban Giám Đốc",
      shortName: "CEO Dashboard",
      icon: LayoutDashboard,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: "bg-terracotta text-white",
      description: "Duyệt nhanh và quản trị tài chính doanh nghiệp"
    },
    {
      id: "hrm",
      name: "Phòng Nhân Sự (HRM)",
      shortName: "Quản lý HRM",
      icon: Users2,
      description: "Quản lý hồ sơ nhân sự, soạn thảo ký kết HĐLD"
    },
    {
      id: "sales",
      name: "Đơn Hàng & Công Nợ",
      shortName: "Kinh doanh & Nợ",
      icon: ShoppingCart,
      description: "Lập đơn hàng bán, kiểm duyệt ngưỡng thanh toán"
    },
    {
      id: "production",
      name: "Sản Xuất & Định Mức BOM",
      shortName: "QL Sản xuất",
      icon: Hammer,
      description: "Cấu hình BOM nguyên vật liệu và lập kế hoạch"
    },
    {
      id: "accountant",
      name: "Kế toán & Tiền lương",
      shortName: "Kế toán",
      icon: Calculator,
      description: "Đối soát lương thợ, kiểm soát công nợ & doanh thu"
    },
    {
      id: "worker-portal",
      name: "Worker Mobile Portal",
      shortName: "Cổng Công nhân",
      icon: Smartphone,
      isMobileFeature: true,
      description: "Simulate giao diện di động cho thợ tại phân xưởng"
    },
    {
      id: "sys-admin",
      name: "Quản trị hệ thống SaaS",
      shortName: "SaaS Admin",
      icon: Shield,
      description: "Đăng ký doanh nghiệp và cấp tài khoản quản trị"
    }
  ];

  const role = currentUser ? currentUser.role.toUpperCase() : "";
  const isSuperAdmin = role === "SUPER_ADMIN" || role.includes("SUPER_ADMIN") || role.includes("TOÀN BỘ HỆ THỐNG SAAS") || role.includes("QUẢN TRỊ HỆ THỐNG");

  // Filter menu items by role
  const allowedMenuItems = menuItems.filter((item) => {
    if (isSuperAdmin) {
      return item.id === "sys-admin";
    }
    
    if (role === "BOD / OWNER" || role === "ADMIN_DN" || role === "DIRECTOR" || role.includes("CHỦ DOANH NGHỆP") || role.includes("GIÁM ĐỐC") || role.includes("QUẢN TRỊ DOANH NGHIỆP")) {
      return item.id !== "sys-admin";
    }
    
    if (role === "HR MANAGER" || role === "HR_STAFF" || role.includes("NHÂN SỰ") || role.includes("HR")) return item.id === "hrm";
    if (role === "SALES STAFF" || role === "SALES_STAFF" || role.includes("KINH DOANH") || role.includes("SALES")) return item.id === "sales";
    if (role === "ACCOUNTANT" || role === "ACCOUNTANT_STAFF" || role === "AD" || role.includes("KẾ TOÁN")) return item.id === "accountant";
    if (role === "PRODUCTION WORKER" || role === "WORKER" || role === "PRODUCTION_STAFF" || role.includes("SẢN XUẤT") || role.includes("CÔNG NHÂN")) return item.id === "worker-portal" || item.id === "production";
    return false;
  });

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out relative shadow-sm h-[calc(100vh-64px)] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      id="enterprise-sidebar"
    >
      {/* Upper Navigation List */}
      <div className="py-4 flex-1 flex flex-col justify-start">
        {!isSuperAdmin && (
          <div className="px-4 mb-4 flex items-center gap-2">
            {!isCollapsed ? (
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <img 
                  src={getCompanyLogoUrl(currentTenant.logo)}
                  alt={currentTenant.name}
                  className="w-8 h-8 rounded-lg object-cover shadow-xs shrink-0 select-none border border-slate-100"
                />
                <div className="text-left truncate">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Doanh nghiệp</div>
                  <div className="text-[12px] font-black text-slate-800 truncate mt-0.5" title={currentTenant.name}>
                    {currentTenant.name}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={getCompanyLogoUrl(currentTenant.logo)}
                alt={currentTenant.name}
                className="w-8 h-8 rounded-lg object-cover shadow-xs shrink-0 select-none border border-slate-100"
              />
            )}
          </div>
        )}

        {/* Main Navigation Menu */}
        <div className="px-2 space-y-1.5">
          <nav className="space-y-1.5">
            {role === "ADMIN_DN" || role.includes("QUẢN TRỊ DOANH NGHIỆP") ? (
              <div className="space-y-4">
                {/* Nhóm menu chính */}
                <div className="space-y-1.5">
                  {[
                    { id: "tenant-admin-dashboard", name: "Tổng quan Dashboard", icon: LayoutDashboard },
                    { id: "tenant-admin-accounts", name: "Nhân sự & Tài khoản", icon: Users2 },
                    { id: "tenant-admin-settings", name: "Thiết lập doanh nghiệp", icon: Settings }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id || (item.id === "tenant-admin-accounts" && activeTab.startsWith("tenant-admin-accounts-dept-"));
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          startTransition(() => {
                            onTabChange(item.id);
                          });
                        }}
                        className={`w-full group relative flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                          isActive
                            ? "bg-slate-teal-light shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                        id={`sidebar-tab-${item.id}`}
                        title={item.name}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="p-1 transition-colors shrink-0 bg-transparent">
                            <IconComponent className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-slate-teal" : "text-slate-400 group-hover:text-slate-600"}`} />
                          </div>
                          {!isCollapsed && (
                            <div className="text-left truncate">
                              <span 
                                className="tracking-tight block text-[13px]" 
                                style={{ 
                                  fontFamily: "'Poppins', sans-serif", 
                                  fontWeight: isActive ? 600 : 500,
                                  color: isActive ? "var(--color-slate-teal)" : "#475569" 
                                }}
                              >
                                {item.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Nhóm phòng ban lọc nhanh */}
                {!isCollapsed && departments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="px-3 mb-2 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider text-left animate-in fade-in" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Lọc theo Phòng ban
                    </div>
                    <div className="space-y-1">
                      {departments.map((dept) => {
                        const targetTab = `tenant-admin-accounts-dept-${dept.id}`;
                        const isActive = activeTab === targetTab;
                        return (
                          <button
                            key={dept.id}
                            onClick={() => {
                              startTransition(() => {
                                onTabChange(targetTab);
                              });
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              isActive 
                                ? "bg-slate-50 text-blue-950 font-bold" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                          >
                            <Layers className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-950" : "text-slate-400"}`} />
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
              </div>
            ) : (
              allowedMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      startTransition(() => {
                        onTabChange(item.id);
                      });
                    }}
                    className={`w-full group relative flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-teal-light shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                    id={`sidebar-tab-${item.id}`}
                    title={item.name}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-1 transition-colors shrink-0 bg-transparent">
                        <IconComponent className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-slate-teal" : "text-slate-400 group-hover:text-slate-600"}`} />
                      </div>
                      {!isCollapsed && (
                        <div className="text-left truncate">
                          <span 
                            className="tracking-tight block text-[13.5px]" 
                            style={{ 
                              fontFamily: "'Poppins', sans-serif", 
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? "var(--color-slate-teal)" : "#475569" 
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge Indicator */}
                    {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[9px] font-black min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full shrink-0 shadow-sm ${item.badgeColor || ""}`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Floating Badge for Collapsed view */}
                    {isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-terracotta border border-white"></span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Info (Tối giản chỉ còn icon và text, không bôi đen) */}
      <div className="p-3 border-t border-slate-50 flex items-center justify-center">
        <div 
          className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all py-1.5"
          title="Hỗ trợ Multi-tenant độc lập dữ liệu & phân vai trò quản trị"
        >
          <HelpCircle className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && (
            <span className="text-[10px] font-semibold ml-2 text-slate-500 whitespace-nowrap" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Mô hình ERP SaaS
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
