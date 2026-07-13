import { useState, useTransition } from "react";
import { SalesOrder, Contract, LeaveRequest } from "../types";
import { TrendingUp, AlertCircle, Check, X, FileText, CalendarRange, UserPlus, FileCheck2, ArrowRight } from "lucide-react";

interface DashboardScreenProps {
  orders: SalesOrder[];
  contracts: Contract[];
  leaves: LeaveRequest[];
  onApproveOrder: (id: string) => void;
  onRejectOrder: (id: string, reason: string) => void;
  onApproveContract: (id: string) => void;
  onRejectContract: (id: string, reason: string) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string, reason: string) => void;
}

export default function DashboardScreen({
  orders,
  contracts,
  leaves,
  onApproveOrder,
  onRejectOrder,
  onApproveContract,
  onRejectContract,
  onApproveLeave,
  onRejectLeave
}: DashboardScreenProps) {
  const [, startTransition] = useTransition();
  const [selectedInboxItem, setSelectedInboxItem] = useState<{
    id: string;
    type: "ORDER" | "CONTRACT" | "LEAVE";
    data: any;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Dynamic Chart States
  const [chartFilter, setChartFilter] = useState<"all" | "product" | "material">("all");
  const [hoveredBar, setHoveredBar] = useState<{
    monthIndex: number;
    monthLabel: string;
    type: "sp" | "nvl" | "sales";
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Calculate dynamic financial metrics based on real-time list state
  const approvedOrders = orders.filter((o) => o.status === "APPROVED");
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const pendingContracts = contracts.filter((c) => c.status === "PENDING");
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPendingCount = pendingOrders.length + pendingContracts.length + pendingLeaves.length;

  const liveRevenueM = Math.round(totalRevenue / 1000000) || 115;
  const liveDSHeight = Math.min(160, liveRevenueM * 0.85);
  const liveDSY = 190 - liveDSHeight;

  // Monthly data matching the exact values
  const monthsData = [
    { label: "Tháng 2", sp: 100, nvl: 60, sales: 110 },
    { label: "Tháng 3", sp: 130, nvl: 80, sales: 120 },
    { label: "Tháng 4", sp: 115, nvl: 70, sales: 135 },
    { label: "Tháng 5", sp: 145, nvl: 90, sales: 125 },
    { label: "Tháng 6", sp: 160, nvl: 110, sales: 140 },
    { label: "Tháng 7", sp: 155, nvl: 105, sales: liveRevenueM }
  ];

  // Helper to compute exact X coordinates of bars based on filters
  const getBarX = (monthIndex: number, barType: "sp" | "nvl" | "sales") => {
    const centerX = 83 + monthIndex * 80;
    if (chartFilter === "all") {
      if (barType === "sp") return centerX - 33;
      if (barType === "nvl") return centerX - 11;
      return centerX + 11;
    } else if (chartFilter === "product") {
      if (barType === "sp") return centerX - 32;
      if (barType === "sales") return centerX;
      return -999; // Offscreen/hidden
    } else { // "material"
      if (barType === "nvl") return centerX - 32;
      if (barType === "sales") return centerX;
      return -999; // Offscreen/hidden
    }
  };

  // Helper to construct trendline coordinates
  const getTrendPathData = (type: "sp" | "nvl" | "sales") => {
    const barWidth = chartFilter === "all" ? 22 : 32;
    const points = monthsData.map((d, idx) => {
      const val = type === "sp" ? d.sp : type === "nvl" ? d.nvl : d.sales;
      const x = getBarX(idx, type) + barWidth / 2; // Center of the wider bar
      const y = 190 - (val / 200) * 170;
      return { x, y, val };
    });
    const pathD = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const areaD = `${pathD} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;
    return { pathD, areaD, points };
  };

  // Formatting utility for money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Simulated static/overdue customer debts (Top 5 as specified in 4.6a)
  const overdueDebts = [
    { client: "Nội Thất Nhà Xinh", debt: 120000000, days: 45, status: "DANGER" },
    { client: "Xây dựng Hoà Bình", debt: 95000000, days: 32, status: "DANGER" },
    { client: "Tập đoàn SunGroup", debt: 82000000, days: 14, status: "WARNING" },
    { client: "Gỗ Mỹ Nghệ Âu Lạc", debt: 45000000, days: 5, status: "WARNING" },
    { client: "Showroom Tân Cổ Điển", debt: 25000000, days: 0, status: "GOOD" }
  ];

  // Quick Approval queue list
  const approvalQueue: { id: string; title: string; subtitle: string; amount?: number; type: "ORDER" | "CONTRACT" | "LEAVE"; data: any; date: string }[] = [];

  pendingOrders.forEach((o) => {
    approvalQueue.push({
      id: o.id,
      title: `Phê duyệt Đơn hàng ${o.code}`,
      subtitle: `Khách hàng: ${o.customerName}`,
      amount: o.totalAmount,
      type: "ORDER",
      data: o,
      date: o.orderDate
    });
  });

  pendingContracts.forEach((c) => {
    approvalQueue.push({
      id: c.id,
      title: `Phê duyệt HĐLD ${c.code}`,
      subtitle: `Nhân sự: ${c.employeeName} (${c.type})`,
      amount: c.basicSalary,
      type: "CONTRACT",
      data: c,
      date: c.startDate
    });
  });

  pendingLeaves.forEach((l) => {
    approvalQueue.push({
      id: l.id,
      title: `Đơn xin nghỉ phép của ${l.employeeName}`,
      subtitle: `Lý do: ${l.reason}`,
      type: "LEAVE",
      data: l,
      date: l.startDate
    });
  });

  const handleApprove = (item: typeof approvalQueue[0]) => {
    startTransition(() => {
      if (item.type === "ORDER") onApproveOrder(item.id);
      else if (item.type === "CONTRACT") onApproveContract(item.id);
      else if (item.type === "LEAVE") onApproveLeave(item.id);
      setSelectedInboxItem(null);
    });
  };

  const handleRejectSubmit = () => {
    if (!selectedInboxItem || !rejectionReason.trim()) return;
    startTransition(() => {
      const { id, type } = selectedInboxItem;
      if (type === "ORDER") onRejectOrder(id, rejectionReason);
      else if (type === "CONTRACT") onRejectContract(id, rejectionReason);
      else if (type === "LEAVE") onRejectLeave(id, rejectionReason);
      setRejectionReason("");
      setShowRejectForm(false);
      setSelectedInboxItem(null);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="bod-dashboard-view">
      {/* View Header with subtle intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center">
            Trung Tâm Điều Hành &amp; Phê Duyệt Executive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Góc nhìn tổng hợp của Ban Giám đốc (BOD) giúp theo dõi doanh thu thực tế, kiểm soát nợ quá hạn và ra quyết định phê duyệt.
          </p>
        </div>
        <div className="text-xs bg-white border border-slate-100 rounded-lg px-3 py-1.5 shadow-sm text-slate-500 font-medium">
          Dòng thời gian: <span className="text-slate-800 font-bold">Tháng 07, 2026</span>
        </div>
      </div>

      {/* KPI 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-dashboard-grid">
        {/* Card 1: Month-to-date Revenue */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Doanh thu Thực nhận YTD</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-green-light text-emerald-green text-[10px] font-bold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>+12.4%</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-teal font-sans tracking-tight block">
              {formatMoney(totalRevenue)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">
              Chỉ tính các đơn đã duyệt chính thức
            </span>
          </div>
        </div>

        {/* Card 2: Overdue Receivables */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Công nợ quá hạn báo đỏ</span>
            <span className="px-2 py-0.5 rounded-full bg-terracotta-light text-terracotta text-[10px] font-bold">
              Cảnh báo
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-terracotta tracking-tight block">
              {formatMoney(342000000)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1.5 block font-sans">
              Có <strong className="text-terracotta font-bold">8 đối tác</strong> quá hạn thanh toán &gt; 30 ngày
            </span>
          </div>
        </div>

        {/* Card 3: Production Yield */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Sản lượng Thành phẩm</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-teal-light text-slate-teal text-[10px] font-bold">
              Đạt QA: 98.5%
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-800 tracking-tight block">
              14,200 sản phẩm
            </span>
            <span className="text-[10px] text-slate-500 mt-1.5 block font-sans">
              Kế hoạch hoàn thành kỳ 1 đạt tiến độ
            </span>
          </div>
        </div>

        {/* Card 4: Pending Approvals count */}
        <div className={`border p-5 rounded-2xl shadow-sm transition-all duration-200 ${
          totalPendingCount > 0 ? "bg-amber-50/50 border-amber-100 pulse-ring" : "bg-white border-slate-100"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Đề xuất chờ phê duyệt</span>
            {totalPendingCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                CẦN XỬ LÝ
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">
                Trống
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-800 tracking-tight block">
              {totalPendingCount} yêu cầu
            </span>
            <span className="text-[10px] text-slate-500 mt-1.5 block font-sans">
              {pendingOrders.length} Đơn hàng | {pendingContracts.length} HĐLD | {pendingLeaves.length} Nghỉ phép
            </span>
          </div>
        </div>
      </div>

      {/* Main Column Grid: Chart vs Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-charts-layout">
        {/* Left Chart (Triple Bar Chart comparing Products, Materials and Sales) - 7 columns */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative group/chart">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Biểu đồ đối chiếu Vận hành - Bán hàng</h3>
                <p className="text-[11px] text-slate-400 mt-1">So sánh tổng hợp khối lượng nhập kho (Thành phẩm &amp; Nguyên vật liệu) đối chiếu với doanh số xuất hàng thực tế.</p>
              </div>

              {/* Toggle controls to filter between All, Product and Raw Material */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-500 self-start sm:self-center">
                <button
                  onClick={() => setChartFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "all" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-800"}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setChartFilter("product")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "product" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-800"}`}
                >
                  Thành phẩm (SP)
                </button>
                <button
                  onClick={() => setChartFilter("material")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${chartFilter === "material" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-800"}`}
                >
                  Vật tư (NVL)
                </button>
              </div>
            </div>

            {/* Legends */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] mt-3 pt-2.5 border-t border-dashed border-slate-100">
              {(chartFilter === "all" || chartFilter === "product") && (
                <div className="flex items-center space-x-1 cursor-help" title="Nhấp hoặc di chuột vào các cột để xem biểu đồ đường xu hướng">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(215, 85%, 46%)" }}></span>
                  <span className="text-slate-500 font-medium">Nhập kho Thành phẩm (SP)</span>
                </div>
              )}
              {(chartFilter === "all" || chartFilter === "material") && (
                <div className="flex items-center space-x-1 cursor-help" title="Nhấp hoặc di chuột vào các cột để xem biểu đồ đường xu hướng">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(220, 60%, 18%)" }}></span>
                  <span className="text-slate-500 font-medium">Nhập kho Vật tư (NVL)</span>
                </div>
              )}
              <div className="flex items-center space-x-1 cursor-help" title="Nhấp hoặc di chuột vào các cột để xem biểu đồ đường xu hướng">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(215, 16%, 55%)" }}></span>
                <span className="text-slate-500 font-medium">Doanh số xuất xưởng (Sales)</span>
              </div>
              <span className="text-[9px] text-slate-400 italic ml-auto hidden sm:inline">💡 Rê chuột vào cột để hiển thị biểu đồ đường xu hướng</span>
            </div>
          </div>

          {/* Clean, interactive, fully-responsive Custom SVG Chart */}
          <div className="my-6 h-56 w-full flex items-end relative">
            <svg viewBox="0 0 600 220" className="w-full h-full font-mono text-[8px] fill-slate-400 overflow-visible">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="570" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="65" x2="570" y2="65" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="110" x2="570" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="155" x2="570" y2="155" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="190" x2="570" y2="190" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

              {/* Y Axis Labels */}
              <text x="5" y="24" textAnchor="start">200M</text>
              <text x="5" y="69" textAnchor="start">150M</text>
              <text x="5" y="114" textAnchor="start">100M</text>
              <text x="5" y="159" textAnchor="start">50M</text>
              <text x="5" y="194" textAnchor="start">VND</text>

              {/* Render Bars for each of the 6 months */}
              {monthsData.map((data, monthIdx) => {
                const isMonthHovered = hoveredBar?.monthIndex === monthIdx;

                // Render metrics based on filter
                const showSP = chartFilter === "all" || chartFilter === "product";
                const showNVL = chartFilter === "all" || chartFilter === "material";
                const showSales = true;

                // Determine widths dynamically (increased as requested)
                const barWidth = chartFilter === "all" ? 22 : 32;
                const hoveredBarWidth = chartFilter === "all" ? 30 : 40;
                const hoverOffset = (hoveredBarWidth - barWidth) / 2; // e.g. (24-18)/2 = 3

                // Calculate positions
                const spX = getBarX(monthIdx, "sp");
                const nvlX = getBarX(monthIdx, "nvl");
                const salesX = getBarX(monthIdx, "sales");

                const spY = 190 - (data.sp / 200) * 170;
                const spHeight = (data.sp / 200) * 170;

                const nvlY = 190 - (data.nvl / 200) * 170;
                const nvlHeight = (data.nvl / 200) * 170;

                const salesY = 190 - (data.sales / 200) * 170;
                const salesHeight = (data.sales / 200) * 170;

                // Check active state
                const isSpHovered = hoveredBar?.monthIndex === monthIdx && hoveredBar?.type === "sp";
                const isNvlHovered = hoveredBar?.monthIndex === monthIdx && hoveredBar?.type === "nvl";
                const isSalesHovered = hoveredBar?.monthIndex === monthIdx && hoveredBar?.type === "sales";

                // Opacity logic: removed dimming when hovering (columns remain fully visible)
                const getOpacity = (barType: "sp" | "nvl" | "sales") => {
                  return "1";
                };

                return (
                  <g key={monthIdx}>
                    {/* 1. SP BAR */}
                    {showSP && (
                      <g>
                        <rect
                          x={isSpHovered ? spX - hoverOffset : spX}
                          y={spY}
                          width={isSpHovered ? hoveredBarWidth : barWidth}
                          height={spHeight}
                          fill="hsl(215, 85%, 46%)"
                          rx={0}
                          opacity={getOpacity("sp")}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredBar({
                              monthIndex: monthIdx,
                              monthLabel: data.label,
                              type: "sp",
                              value: data.sp,
                              x: spX + barWidth / 2,
                              y: spY
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                        {/* Value label inside the bar section */}
                        <text
                          x={spX + barWidth / 2}
                          y={spY - 4}
                          textAnchor="middle"
                          className="text-[7px] font-bold fill-slate-500 transition-all"
                          opacity={getOpacity("sp")}
                        >
                          {data.sp}
                        </text>
                      </g>
                    )}

                    {/* 2. NVL BAR */}
                    {showNVL && (
                      <g>
                        <rect
                          x={isNvlHovered ? nvlX - hoverOffset : nvlX}
                          y={nvlY}
                          width={isNvlHovered ? hoveredBarWidth : barWidth}
                          height={nvlHeight}
                          fill="hsl(220, 60%, 18%)"
                          rx={0}
                          opacity={getOpacity("nvl")}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredBar({
                              monthIndex: monthIdx,
                              monthLabel: data.label,
                              type: "nvl",
                              value: data.nvl,
                              x: nvlX + barWidth / 2,
                              y: nvlY
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                        <text
                          x={nvlX + barWidth / 2}
                          y={nvlY - 4}
                          textAnchor="middle"
                          className="text-[7px] font-bold fill-slate-500 transition-all"
                          opacity={getOpacity("nvl")}
                        >
                          {data.nvl}
                        </text>
                      </g>
                    )}

                    {/* 3. SALES BAR */}
                    {showSales && (
                      <g>
                        <rect
                          x={isSalesHovered ? salesX - hoverOffset : salesX}
                          y={salesY}
                          width={isSalesHovered ? hoveredBarWidth : barWidth}
                          height={salesHeight}
                          fill="hsl(215, 16%, 55%)"
                          rx={0}
                          opacity={getOpacity("sales")}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredBar({
                              monthIndex: monthIdx,
                              monthLabel: data.label,
                              type: "sales",
                              value: data.sales,
                              x: salesX + barWidth / 2,
                              y: salesY
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                        <text
                          x={salesX + barWidth / 2}
                          y={salesY - 4}
                          textAnchor="middle"
                          className="text-[7px] font-bold fill-slate-600 transition-all"
                          opacity={getOpacity("sales")}
                        >
                          {data.sales}
                        </text>
                      </g>
                    )}

                    {/* X Axis Month Label */}
                    <text
                      x={83 + monthIdx * 80}
                      y="208"
                      textAnchor="middle"
                      className={`transition-all duration-200 ${isMonthHovered ? "font-bold fill-slate-800" : "fill-slate-500"}`}
                    >
                      {data.label}
                    </text>
                  </g>
                );
              })}

              {/* OVERLAY TRENDLINE CHART WHEN A BAR IS HOVERED */}
              {hoveredBar && (() => {
                const { pathD, points } = getTrendPathData(hoveredBar.type);
                const activeColor = hoveredBar.type === "sp" ? "hsl(215, 85%, 46%)" : hoveredBar.type === "nvl" ? "hsl(220, 60%, 18%)" : "hsl(215, 16%, 55%)";
                return (
                  <g key={`trendline-${hoveredBar.type}`}>
                    {/* Dotted helper vertical drop lines for each node */}
                    {points.map((p, idx) => (
                      <line
                        key={`line-${idx}`}
                        x1={p.x}
                        y1={p.y}
                        x2={p.x}
                        y2="190"
                        stroke={activeColor}
                        strokeWidth="0.75"
                        strokeDasharray="2,2"
                        opacity="0.3"
                        pointerEvents="none"
                      />
                    ))}

                    {/* Faint, elegant dashed trendline as requested */}
                    <path
                      d={pathD}
                      stroke={activeColor}
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.55"
                      pointerEvents="none"
                    />

                    {/* Circular points along the trendline with a single focused badge */}
                    {points.map((p, idx) => {
                      const isCurrentNode = idx === hoveredBar.monthIndex;
                      return (
                        <g key={`node-${idx}`} pointerEvents="none">
                          {isCurrentNode && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="7"
                              fill={activeColor}
                              opacity="0.2"
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isCurrentNode ? "4.5" : "2.5"}
                            fill={isCurrentNode ? "#ffffff" : activeColor}
                            stroke={activeColor}
                            strokeWidth={isCurrentNode ? "2" : "0"}
                            opacity={isCurrentNode ? "1" : "0.5"}
                          />

                          {/* Value overlay bubble ONLY for the currently hovered node */}
                          {isCurrentNode && (
                            <g transform={`translate(${p.x}, ${p.y - 14})`}>
                              <rect
                                x="-14"
                                y="-6"
                                width="28"
                                height="12"
                                rx="3.5"
                                fill={activeColor}
                                stroke="#ffffff"
                                strokeWidth="0.5"
                                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" }}
                              />
                              <text
                                x="0"
                                y="2"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="7.5px"
                                fontWeight="bold"
                              >
                                {p.val}M
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>Dữ liệu cập nhật liên tục: 5 phút trước</span>
            <span className="font-semibold text-slate-500">Đơn vị đo lường: Triệu VND (M)</span>
          </div>
        </div>

        {/* Right Panel: Top Customer Debt Table - 5 columns */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top 5 Công Nợ Khách Hàng Quá Hạn</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Phải thu lớn nhất cần đốc thúc để giải toả nghẽn dòng tiền.
            </p>
          </div>

          <div className="my-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                  <th className="py-2 pl-1">Khách hàng</th>
                  <th className="py-2 text-right">Tổng nợ</th>
                  <th className="py-2 text-right">Quá hạn</th>
                  <th className="py-2 pr-1 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overdueDebts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-700 pl-1">{item.client}</td>
                    <td className="py-2.5 text-right font-mono text-slate-900">{formatMoney(item.debt)}</td>
                    <td className="py-2.5 text-right text-slate-500 font-mono">{item.days} ngày</td>
                    <td className="py-2.5 text-right pr-1">
                      {item.status === "DANGER" ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-terracotta-light text-terracotta">Nợ xấu</span>
                      ) : item.status === "WARNING" ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sage-amber-light text-sage-amber">Cần đòi</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-green-light text-emerald-green">An toàn</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-50 pt-3 text-center">
            <button className="text-xs text-slate-teal font-semibold hover:underline inline-flex items-center space-x-1">
              <span>Xem Sổ nợ chi tiết &amp; Đặt hạn mức tín dụng</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Approval Inbox Segment */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6" id="quick-approval-inbox-section">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <FileCheck2 className="w-4 h-4 text-slate-teal mr-2" />
              Hộp Thư Phê Duyệt Tập Trung (BOD Approval Queue)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Nơi ban giám đốc xem xét nhanh chi tiết đề xuất nhân sự, thanh toán, hoặc đơn hàng lớn của Tenant.
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600">
            {approvalQueue.length} Chờ Duyệt
          </span>
        </div>

        {approvalQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Check className="w-12 h-12 text-emerald-green mx-auto mb-3 bg-emerald-green-light p-2.5 rounded-full" />
            <h4 className="text-sm font-semibold text-slate-700">Tuyệt vời! Đã duyệt sạch tất cả yêu cầu</h4>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">Các phòng ban đang vận hành trong ngưỡng tự động hoặc không phát sinh đề xuất mới cần sếp ký tên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Hand: Queue List - 5 columns */}
            <div className="lg:col-span-5 space-y-2 border-r border-slate-50 pr-0 lg:pr-4 max-h-[380px] overflow-y-auto">
              {approvalQueue.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setSelectedInboxItem({ id: item.id, type: item.type, data: item.data });
                    setShowRejectForm(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    selectedInboxItem?.id === item.id && selectedInboxItem?.type === item.type
                      ? "border-slate-teal bg-slate-teal-light/60 shadow-sm"
                      : "border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      item.type === "ORDER"
                        ? "bg-sage-amber-light text-sage-amber-dark"
                        : item.type === "CONTRACT"
                        ? "bg-slate-teal-light text-slate-teal"
                        : "bg-terracotta-light text-terracotta"
                    }`}>
                      {item.type === "ORDER" ? "Đơn hàng vượt ngưỡng" : item.type === "CONTRACT" ? "Hợp đồng nhân sự" : "Nghỉ phép công nhân"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 mt-2 truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{item.subtitle}</p>

                  {item.amount && (
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">Trị giá đề xuất:</span>
                      <span className="text-xs font-bold font-mono text-slate-800">{formatMoney(item.amount)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Right Hand: Detailed view and Quick Approval/Rejection panel - 7 columns */}
            <div className="lg:col-span-7 bg-slate-50/40 border border-slate-100 rounded-xl p-5 relative">
              {selectedInboxItem ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-200">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {selectedInboxItem.type === "ORDER"
                          ? `HỒ SƠ ĐƠN HÀNG ${selectedInboxItem.data.code}`
                          : selectedInboxItem.type === "CONTRACT"
                          ? `DỰ THẢO HỢP ĐỒNG ${selectedInboxItem.data.code}`
                          : `ĐƠN XIN NGHỈ PHÉP`}
                      </h4>
                      <span className="text-[11px] text-slate-400">Xem xét và phê duyệt chứng từ</span>
                    </div>
                    <button
                      onClick={() => setSelectedInboxItem(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Render content depending on selected type */}
                  {selectedInboxItem.type === "ORDER" && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-medium">Khách hàng</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.customerName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Ngày đặt đơn</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.orderDate}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 font-medium">Lưu ý nghiệp vụ</div>
                        <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 mt-1 italic">
                          "{selectedInboxItem.data.notes || "Không có ghi chú"}"
                        </p>
                      </div>

                      <div>
                        <div className="text-slate-400 font-medium mb-1.5">Chi tiết sản phẩm đặt mua</div>
                        <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold">
                                <th className="p-2">Sản phẩm</th>
                                <th className="p-2 text-right">SL</th>
                                <th className="p-2 text-right">Đơn giá</th>
                                <th className="p-2 text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedInboxItem.data.items.map((line: any, i: number) => (
                                <tr key={i} className="border-b border-slate-50 last:border-0 text-[11px]">
                                  <td className="p-2 font-medium text-slate-700">{line.productName}</td>
                                  <td className="p-2 text-right font-mono">{line.quantity}</td>
                                  <td className="p-2 text-right font-mono">{formatMoney(line.price)}</td>
                                  <td className="p-2 text-right font-mono font-semibold">{formatMoney(line.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-3 rounded-lg mt-3 text-amber-900 font-medium text-xs">
                        <span className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600 shrink-0" />
                          Yêu cầu duyệt vượt hạn mức (Ngưỡng quy định: 50M)
                        </span>
                        <span className="font-bold font-mono text-slate-900">{formatMoney(selectedInboxItem.data.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  {selectedInboxItem.type === "CONTRACT" && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-medium">Nhân sự thụ hưởng</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.employeeName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Loại hợp đồng</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.type}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-medium">Ngày hiệu lực</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.startDate}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Ngày hết hạn</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.endDate}</div>
                        </div>
                      </div>

                      <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200/50 flex justify-between items-center mt-2">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Lương cơ bản thoả thuận</span>
                          <span className="text-sm font-bold text-slate-teal font-mono">{formatMoney(selectedInboxItem.data.basicSalary)} / tháng</span>
                        </div>
                        {selectedInboxItem.data.attachmentName && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">File đính kèm:</span>
                            <span className="text-xs text-slate-600 font-semibold underline cursor-pointer">{selectedInboxItem.data.attachmentName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedInboxItem.type === "LEAVE" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-medium">Công nhân xin nghỉ</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.employeeName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Ngày gửi đơn</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.createdAt ? selectedInboxItem.data.createdAt.split('T')[0] : "Hôm nay"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-medium">Từ ngày</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.startDate}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Đến hết ngày</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{selectedInboxItem.data.endDate}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 font-medium">Lý do nghỉ phép</div>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100 mt-1 italic leading-relaxed">
                          "{selectedInboxItem.data.reason}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons and inline Rejection input */}
                  {showRejectForm ? (
                    <div className="border-t border-slate-100 pt-4 space-y-3 animate-in fade-in duration-150">
                      <label className="text-xs font-bold text-slate-700 block">Lý do từ chối phê duyệt (Bắt buộc):</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Vui lòng nhập lý do rõ ràng để phòng ban liên quan nắm rõ và cập nhật lại hồ sơ/chứng từ..."
                        rows={3}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-terracotta"
                      />
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-medium"
                        >
                          Huỷ bỏ
                        </button>
                        <button
                          disabled={!rejectionReason.trim()}
                          onClick={handleRejectSubmit}
                          className="px-4 py-1.5 rounded-lg text-xs bg-terracotta hover:bg-terracotta-hover text-white disabled:opacity-50 transition-colors font-semibold"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 border-t border-slate-100 pt-4">
                      {/* Approved Button */}
                      <button
                        onClick={() => handleApprove(selectedInboxItem as any)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-teal hover:bg-slate-teal-hover text-white font-semibold text-xs shadow-sm transition-all duration-200 hover:shadow"
                      >
                        <Check className="w-4 h-4" />
                        <span>Duyệt &amp; Ký số</span>
                      </button>

                      {/* Reject Trigger */}
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-terracotta text-slate-500 hover:text-terracotta font-semibold text-xs transition-all duration-200"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                  <FileText className="w-12 h-12 text-slate-200 mb-3" />
                  <h4 className="text-slate-600 font-semibold">Chưa chọn nội dung phê duyệt</h4>
                  <p className="max-w-xs mt-1">Chọn bất kỳ một đề xuất nào trong hàng đợi bên trái để hiển thị chi tiết hồ sơ thẩm định của Tenant.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
