import { useState, useTransition } from "react";
import { LayoutDashboard, Users2, ShoppingCart, Hammer, Smartphone, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Tenant } from "../types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingApprovalsCount: number;
  currentTenant: Tenant;
}

export default function Sidebar({ activeTab, onTabChange, pendingApprovalsCount, currentTenant }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, startTransition] = useTransition();

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
      id: "worker-portal",
      name: "Worker Mobile Portal",
      shortName: "Cổng Công nhân",
      icon: Smartphone,
      isMobileFeature: true,
      description: "Simulate giao diện di động cho thợ tại phân xưởng"
    }
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out relative shadow-sm h-[calc(100vh-64px)] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      id="enterprise-sidebar"
    >
      {/* Upper Navigation List */}
      <div className="py-4 flex-1">
        <div className={`px-4 mb-4 flex items-center gap-2 ${isCollapsed ? "flex-col justify-center gap-3" : "justify-between"}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-slate-teal flex items-center justify-center text-white font-display font-black text-xs tracking-wide shadow-xs shrink-0 select-none">
                {currentTenant.logo}
              </div>
              <div className="text-left truncate">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Doanh nghiệp</div>
                <div className="text-[12px] font-black text-slate-800 truncate mt-0.5" title={currentTenant.name}>
                  {currentTenant.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-teal flex items-center justify-center text-white font-display font-black text-xs tracking-wide shadow-xs shrink-0 select-none" title={currentTenant.name}>
              {currentTenant.logo}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
            id="sidebar-toggle-btn"
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <nav className="space-y-1.5 px-2">
          {menuItems.map((item) => {
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
                className={`w-full group flex items-center rounded-xl py-2.5 transition-all duration-200 relative ${
                  isCollapsed ? "justify-center px-2" : "px-3 justify-between"
                } ${
                  isActive
                    ? "bg-slate-teal-light text-slate-teal font-bold shadow-xs scale-[1.01]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${item.isMobileFeature ? "border-t border-dashed border-slate-100 mt-4" : ""}`}
                id={`sidebar-tab-${item.id}`}
                title={item.name}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                  <div
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isActive
                        ? "bg-slate-teal text-white"
                        : "bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <span className="text-xs tracking-tight">{item.name}</span>
                      {item.isMobileFeature && (
                        <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full uppercase scale-90 inline-block">
                          Sim
                        </span>
                      )}
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
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-50 bg-slate-50/50 m-2 rounded-2xl text-center">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Mô hình ERP SaaS</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Hỗ trợ Multi-tenant độc lập dữ liệu &amp; phân vai trò quản trị.
          </p>
        </div>
      )}
    </aside>
  );
}
