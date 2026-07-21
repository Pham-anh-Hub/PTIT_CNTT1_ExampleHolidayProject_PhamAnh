import { useState, useEffect, useTransition } from "react";
import { SalesOrder, Contract, LeaveRequest, MaterialImport, SupplierPayable } from "../types";
import { TrendingUp, AlertCircle, Check, X, FileText, CalendarRange, UserPlus, FileCheck2, ArrowRight, DollarSign, Wallet, RefreshCw, Landmark } from "lucide-react";
import {
  getBodKpiCardsApi,
  getBodRevenueTrendApi,
  getBodCostStructureApi,
  getBodCustomerDebtApi,
  simulateBodNotificationApi
} from "../api";

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
  liveNotifications?: any[];
  targetNotificationId?: number | null;
  onClearTargetNotification?: () => void;
  onMarkNotificationRead?: (id: number) => void;
  materialImports?: MaterialImport[];
  supplierPayables?: SupplierPayable[];
  corporateTaxRate?: number;
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
  onRejectLeave,
  liveNotifications = [],
  targetNotificationId,
  onClearTargetNotification,
  onMarkNotificationRead,
  materialImports = [],
  supplierPayables = [],
  corporateTaxRate = 20
}: DashboardScreenProps) {
  const [, startTransition] = useTransition();
  const [selectedInboxItem, setSelectedInboxItem] = useState<{
    id: string;
    type: "ORDER" | "CONTRACT" | "LEAVE";
    data: any;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  // Dynamic States for API data
  const [kpiData, setKpiData] = useState<{
    totalRevenue: number;
    actualRevenue: number;
    totalProductionCost: number;
    netProfit: number;
    totalDebt: number;
  }>({
    totalRevenue: 0,
    actualRevenue: 0,
    totalProductionCost: 0,
    netProfit: 0,
    totalDebt: 0
  });

  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [costStructure, setCostStructure] = useState<any[]>([]);
  const [customerDebt, setCustomerDebt] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation form states
  const [simTitle, setSimTitle] = useState("Đề xuất đơn hàng mới chờ duyệt");
  const [simMessage, setSimMessage] = useState("Đơn hàng DH-2026-008 vượt ngưỡng trị giá 75,000,000 VND cần Giám đốc ký duyệt số.");
  const [simType, setSimType] = useState("ORDER");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Hover tooltip state for Combo Chart
  const [hoveredTrendBar, setHoveredTrendBar] = useState<{
    x: number;
    y: number;
    monthLabel: string;
    revenue: number;
    sales: number;
    profit: number;
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiRes, trendRes, costRes, debtRes] = await Promise.all([
        getBodKpiCardsApi(),
        getBodRevenueTrendApi(),
        getBodCostStructureApi(),
        getBodCustomerDebtApi()
      ]);

      setKpiData(kpiRes.data || {
        totalRevenue: 0,
        actualRevenue: 0,
        totalProductionCost: 0,
        netProfit: 0,
        totalDebt: 0
      });
      setRevenueTrend(trendRes.data || []);
      setCostStructure(costRes.data || []);
      setCustomerDebt(debtRes.data || []);
    } catch (err: any) {
      console.error("Lỗi lấy dữ liệu thống kê Dashboard:", err);
      setError("Không thể nạp dữ liệu thống kê từ máy chủ Backend. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simTitle.trim() || !simMessage.trim()) return;
    try {
      setIsSimulating(true);
      setSimSuccess(null);
      await simulateBodNotificationApi({
        title: simTitle.trim(),
        message: simMessage.trim(),
        type: simType,
        referenceId: Math.floor(Math.random() * 1000)
      });
      setSimSuccess("Đã phát yêu cầu phê duyệt giả lập qua WebSocket thành công!");
      setTimeout(() => setSimSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Gửi giả lập thất bại.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper selector for pending approvals count
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const pendingContracts = contracts.filter((c) => c.status === "PENDING");
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  // Formatting utility for money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  // Build approval queue list từ dữ liệu thật
  const approvalQueue: { id: string; title: string; subtitle: string; amount?: number; type: "ORDER" | "CONTRACT" | "LEAVE"; data: any; date: string }[] = [];

  liveNotifications.filter(n => !n.isRead && (!n.targetRole || n.targetRole === "BOD") && n.type !== "ACCOUNTANT_EXPLANATION").forEach((n) => {
    let tType: "ORDER" | "CONTRACT" | "LEAVE" = "ORDER";
    if (n.type === "CONTRACT") tType = "CONTRACT";
    if (n.type === "LEAVE") tType = "LEAVE";

    // Phân tích nhanh message để lấy thông tin giả lập số tiền nếu có
    let amt: number | undefined;
    const match = (n.message || "").match(/([0-9.,]+)\s*[đd]/i);
    if (match) {
      amt = parseInt(match[1].replace(/[,.]/g, ""), 10);
    }

    approvalQueue.push({
      id: String(n.id || n.referenceId || Math.random()),
      title: n.title,
      subtitle: n.message,
      amount: amt,
      type: tType,
      data: n,
      date: n.createdAt ? n.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10)
    });
  });

  // Xử lý tự động chọn thông báo từ chuông
  useEffect(() => {
    if (targetNotificationId && approvalQueue.length > 0) {
      const item = approvalQueue.find((q) => q.data.id === targetNotificationId);
      if (item) {
        setSelectedInboxItem({ id: item.id, type: item.type, data: item.data });
        setShowRejectForm(false);
        setTimeout(() => {
          document.getElementById('quick-approval-inbox-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
      if (onClearTargetNotification) {
        onClearTargetNotification();
      }
    }
  }, [targetNotificationId, approvalQueue, onClearTargetNotification]);

  const handleApproveClick = () => {
    setShowConfirmApprove(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedInboxItem) return;
    startTransition(() => {
      if (onMarkNotificationRead && selectedInboxItem.data.id) {
        // Gọi API mark read thông qua prop truyền xuống
        onMarkNotificationRead(selectedInboxItem.data.id);
      } else {
        // Fallback cho mock data cũ nếu có
        if (selectedInboxItem.type === "ORDER") onApproveOrder(selectedInboxItem.id);
        else if (selectedInboxItem.type === "CONTRACT") onApproveContract(selectedInboxItem.id);
        else if (selectedInboxItem.type === "LEAVE") onApproveLeave(selectedInboxItem.id);
      }
      setShowConfirmApprove(false);
      setSelectedInboxItem(null);
    });
  };

  const handleRejectSubmit = () => {
    if (!selectedInboxItem || !rejectionReason.trim()) return;
    startTransition(() => {
      if (onMarkNotificationRead && selectedInboxItem.data.id) {
        // Gọi API mark read để đánh dấu thông báo này là đã xử lý (từ chối)
        onMarkNotificationRead(selectedInboxItem.data.id);
      } else {
        const { id, type } = selectedInboxItem;
        if (type === "ORDER") onRejectOrder(id, rejectionReason);
        else if (type === "CONTRACT") onRejectContract(id, rejectionReason);
        else if (type === "LEAVE") onRejectLeave(id, rejectionReason);
      }
      setRejectionReason("");
      setShowRejectForm(false);
      setSelectedInboxItem(null);
    });
  };

  const formatPeriodLabel = (p: string) => {
    if (!p) return "";
    const parts = p.split("-");
    if (parts.length === 2) {
      return `Tháng ${parseInt(parts[1], 10)}`;
    }
    return p;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3" id="bod-dashboard-loading">
        <RefreshCw className="w-10 h-10 text-slate-teal animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Đang đồng bộ số liệu tài chính thời gian thực...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center space-y-4" id="bod-dashboard-error">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-sm font-black text-rose-800">Lỗi nạp dữ liệu thống kê</h3>
        <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Thử kết nối lại
        </button>
      </div>
    );
  }

  // Margin Rate calculation
  const marginRate = kpiData.totalRevenue > 0
    ? ((kpiData.netProfit / kpiData.totalRevenue) * 100).toFixed(1)
    : "0.0";

  // Real-time or Fallback static dataset to ensure smooth dashboard charts
  const finalTrend = revenueTrend.length > 0 ? revenueTrend : [
    { period: "2026-02", revenue: 80000000, sales: 110000000, profit: 20000000 },
    { period: "2026-03", revenue: 100000000, sales: 120000000, profit: 25000000 },
    { period: "2026-04", revenue: 95000000, sales: 135000000, profit: 22000000 },
    { period: "2026-05", revenue: 110000000, sales: 125000000, profit: 30000000 },
    { period: "2026-06", revenue: 120000000, sales: 140000000, profit: 35000000 },
    { period: "2026-07", revenue: kpiData.actualRevenue || 115000000, sales: kpiData.totalRevenue || 155000000, profit: kpiData.netProfit || 40000000 }
  ];

  const finalCostStructure = costStructure.length > 0 ? costStructure : [
    { costName: "Chi phí vật tư", amount: kpiData.totalProductionCost || 70000000, percentage: 55 },
    { costName: "Lương nhân công", amount: 45000000, percentage: 35 },
    { costName: "Thuế & Khác", amount: 15000000, percentage: 10 }
  ];

  const finalCustomerDebt = customerDebt.length > 0 ? customerDebt : [
    { customerName: "Nội Thất Nhà Xinh", debtAmount: 120000000 },
    { customerName: "Xây dựng Hoà Bình", debtAmount: 95000000 },
    { customerName: "Tập đoàn SunGroup", debtAmount: 82000000 },
    { customerName: "Gỗ Mỹ Nghệ Âu Lạc", debtAmount: 45000000 },
    { customerName: "Showroom Tân Cổ Điển", debtAmount: 25000000 }
  ];

  const totalCostVal = finalCostStructure.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="bod-dashboard-view">
      {/* View Header with subtle intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center">
            Trung Tâm Điều Hành &amp; Báo Cáo Tài Chính Executive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Góc nhìn tổng hợp tài chính thời gian thực và quản lý hàng đợi ký duyệt dành cho Ban Giám đốc (BOD).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
            title="Đồng bộ lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-xs bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm text-slate-500 font-medium">
            Thời gian: <span className="text-slate-800 font-bold">Tháng 07, 2026</span>
          </div>
        </div>
      </div>

      {/* KPI 5-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="kpi-dashboard-grid">
        {/* Card 1: Doanh thu danh nghĩa */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-600 font-sans">Doanh thu Danh nghĩa</span>
            <span className="p-1.5 rounded-xl bg-slate-50 text-slate-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-semibold text-slate-800 tracking-tight font-sans">
              {formatMoney(kpiData.totalRevenue)}
            </h3>
            <span className="text-xs text-slate-400 block mt-1 font-sans">Trị giá đơn hàng đã ký duyệt</span>
          </div>
        </div>

        {/* Card 2: Doanh thu Thực thu */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-600 font-sans">Thực thu nhận về</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-green-light text-emerald-green text-[10px] font-bold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Thực tế</span>
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-semibold text-slate-800 tracking-tight font-sans">
              {formatMoney(kpiData.actualRevenue)}
            </h3>
            <span className="text-xs text-slate-400 block mt-1 font-sans">Dòng tiền thực thu từ khách</span>
          </div>
        </div>

        {/* Card 3: Chi chi phí vận hành */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-600 font-sans">Tổng Chi phí Vận hành</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-semibold text-slate-800 tracking-tight font-sans">
              {formatMoney(kpiData.totalProductionCost)}
            </h3>
            <span className="text-xs text-slate-400 block mt-1 font-sans">Ngân sách vật tư, nhân công</span>
          </div>
        </div>

        {/* Card 4: Lợi nhuận ròng */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-600 font-sans">Lợi nhuận ròng</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-teal-light text-slate-teal text-[9px] font-bold">
              Biên lãi: {marginRate}%
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-semibold text-slate-teal tracking-tight font-sans">
              {formatMoney(kpiData.netProfit)}
            </h3>
            <span className="text-xs text-slate-400 block mt-1 font-sans">Doanh thu trừ hết mọi chi phí</span>
          </div>
        </div>

        {/* Card 5: Tổng nợ khách hàng */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-600 font-sans">Công nợ khách hàng</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-semibold text-amber-700 tracking-tight font-sans">
              {formatMoney(kpiData.totalDebt)}
            </h3>
            <span className="text-xs text-slate-400 block mt-1 font-sans">Chưa thu hồi (sales - thực thu)</span>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Combo Chart & Cost Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Combo Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-8 relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Xu hướng Doanh thu &amp; Lợi nhuận ròng</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Bar (Cột chồng): Doanh thu thực tế (dưới) &amp; Công nợ (trên). Line (Đường): Lợi nhuận.</p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-950"></span>
                <span className="text-slate-500">Thực thu</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
                <span className="text-slate-500">Nợ quá hạn</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block relative top-[-1px]"></span>
                <span className="text-slate-500">Lợi nhuận</span>
              </div>
            </div>
          </div>

          {/* SVG Combo Chart */}
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 600 220">
              {/* Grid Lines */}
              <line x1="45" y1="20" x2="560" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="45" y1="62.5" x2="560" y2="62.5" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="45" y1="105" x2="560" y2="105" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="45" y1="147.5" x2="560" y2="147.5" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="45" y1="190" x2="560" y2="190" stroke="#cbd5e1" strokeWidth="1" />

              {/* Y Axis scale indicators */}
              <text x="35" y="24" textAnchor="end" className="text-[9px] font-bold font-mono fill-slate-400">160M</text>
              <text x="35" y="66.5" textAnchor="end" className="text-[9px] font-bold font-mono fill-slate-400">120M</text>
              <text x="35" y="109" textAnchor="end" className="text-[9px] font-bold font-mono fill-slate-400">80M</text>
              <text x="35" y="151.5" textAnchor="end" className="text-[9px] font-bold font-mono fill-slate-400">40M</text>
              <text x="35" y="194" textAnchor="end" className="text-[9px] font-bold font-mono fill-slate-400">0M</text>

              {/* Draw bars */}
              {(() => {
                const maxVal = Math.max(...finalTrend.map(d => Math.max(d.sales || 0, d.revenue || 0, Math.abs(d.profit || 0))), 160000000) || 160000000;
                
                return finalTrend.map((d, idx) => {
                  const colX = 65 + idx * 80;
                  const revHeight = ((d.revenue || 0) / maxVal) * 170;
                  const revY = 190 - revHeight;

                  const debtVal = Math.max(0, (d.sales || 0) - (d.revenue || 0));
                  const debtHeight = (debtVal / maxVal) * 170;
                  const debtY = revY - debtHeight;

                  return (
                    <g key={idx} className="cursor-pointer group">
                      {/* Stacked Bar background hover */}
                      <rect
                        x={colX - 18}
                        y="15"
                        width="36"
                        height="180"
                        fill="transparent"
                        className="group-hover:fill-slate-50/50 transition-colors"
                        onMouseEnter={() => {
                          setHoveredTrendBar({
                            x: colX,
                            y: debtY,
                            monthLabel: formatPeriodLabel(d.period),
                            revenue: d.revenue,
                            sales: d.sales,
                            profit: d.profit
                          });
                        }}
                        onMouseLeave={() => setHoveredTrendBar(null)}
                      />

                      {/* Doanh thu thực thu (Bottom Rect) */}
                      <rect
                        x={colX - 12}
                        y={revY}
                        width="24"
                        height={Math.max(2, revHeight)}
                        className="transition-all duration-300 group-hover:opacity-90 fill-blue-950"
                      />

                      {/* Công nợ phải thu (Top Rect) */}
                      <rect
                        x={colX - 12}
                        y={debtY}
                        width="24"
                        height={Math.max(0, debtHeight)}
                        className="transition-all duration-300 group-hover:opacity-90 fill-slate-300"
                      />

                      {/* X Axis label */}
                      <text x={colX} y="206" textAnchor="middle" className="text-[9px] font-bold fill-slate-500">
                        {formatPeriodLabel(d.period)}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Draw Lợi nhuận Line Chart */}
              {(() => {
                const maxVal = Math.max(...finalTrend.map(d => Math.max(d.sales || 0, d.revenue || 0, Math.abs(d.profit || 0))), 160000000) || 160000000;
                
                const points = finalTrend.map((d, idx) => {
                  const colX = 65 + idx * 80;
                  const y = 190 - ((d.profit || 0) / maxVal) * 170;
                  return { x: colX, y, profit: d.profit };
                });

                const pathD = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");

                return (
                  <g>
                    {/* Glow behind line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth="3"
                      className="opacity-20 blur-sm"
                    />
                    {/* Active Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    {/* Points on the line */}
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="white"
                        stroke="hsl(142, 71%, 45%)"
                        strokeWidth="2"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => {
                          const t = finalTrend[idx];
                          setHoveredTrendBar({
                            x: p.x,
                            y: p.y,
                            monthLabel: formatPeriodLabel(t.period),
                            revenue: t.revenue,
                            sales: t.sales,
                            profit: t.profit
                          });
                        }}
                        onMouseLeave={() => setHoveredTrendBar(null)}
                      />
                    ))}
                  </g>
                );
              })()}
            </svg>

            {/* Premium hover tooltip absolute box */}
            {hoveredTrendBar && (
              <div
                style={{
                  left: `${(hoveredTrendBar.x / 600) * 100}%`,
                  top: `${Math.max(10, (hoveredTrendBar.y / 220) * 100 - 30)}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-full bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl text-[10px] pointer-events-none z-30 min-w-[150px] border border-white/10"
              >
                <div className="font-extrabold border-b border-white/10 pb-1 mb-1 text-slate-300">
                  {hoveredTrendBar.monthLabel}
                </div>
                <div className="flex justify-between space-x-3 mt-1">
                  <span className="text-slate-400">Doanh thu tạo ra:</span>
                  <span className="font-bold font-mono">{formatMoney(hoveredTrendBar.sales)}</span>
                </div>
                <div className="flex justify-between space-x-3 mt-0.5">
                  <span className="text-slate-400">Thực thu:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatMoney(hoveredTrendBar.revenue)}</span>
                </div>
                <div className="flex justify-between space-x-3 mt-0.5">
                  <span className="text-slate-400">Nợ phải thu:</span>
                  <span className="font-bold text-amber-400 font-mono">{formatMoney(hoveredTrendBar.sales - hoveredTrendBar.revenue)}</span>
                </div>
                <div className="flex justify-between space-x-3 mt-1 pt-1 border-t border-white/10 font-black">
                  <span className="text-slate-300">Lợi nhuận ròng:</span>
                  <span className="font-mono text-emerald-300">{formatMoney(hoveredTrendBar.profit)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Structure Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Cơ cấu Chi phí Doanh nghiệp</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Phân bổ tỷ lệ các khoản chi sản xuất, nhân sự &amp; thuế.</p>
          </div>

          <div className="py-4 relative">
            <svg width="180" height="180" viewBox="0 0 160 160" className="mx-auto overflow-visible">
              <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f8fafc" strokeWidth="16" />
              {(() => {
                let currentOffset = 0;
                return finalCostStructure.map((item, idx) => {
                  const circumference = 2 * Math.PI * 60; // 376.99
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -currentOffset - (circumference * 0.25); // -94.2 to start at 12 o'clock
                  currentOffset += (item.percentage / 100) * circumference;

                  const colors = [
                    "hsl(215, 85%, 46%)",  // Production cost / Navy
                    "hsl(142, 71%, 45%)",  // Labor / Green
                    "hsl(38, 92%, 50%)"    // Tax & other / Orange
                  ];

                  return (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r="60"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 hover:stroke-[20px] cursor-pointer"
                    />
                  );
                });
              })()}
              
              {/* Inner label */}
              <text x="80" y="78" textAnchor="middle" className="text-[11px] font-black fill-slate-700" style={{ fontFamily: "'Poppins', sans-serif" }}>Cơ cấu</text>
              <text x="80" y="94" textAnchor="middle" className="text-[9px] font-black fill-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>{formatMoney(totalCostVal)}</text>
            </svg>
          </div>

          {/* Cost breakdown list */}
          <div className="space-y-2 text-[10px] font-bold">
            {finalCostStructure.map((item, idx) => {
              const colors = [
                "bg-blue-950",
                "bg-emerald-500",
                "bg-amber-500"
              ];
              return (
                <div key={idx} className="flex justify-between items-center bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <span className="flex items-center text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]} mr-1.5`}></span>
                    {item.costName}
                  </span>
                  <span className="text-slate-800 font-mono">
                    {formatMoney(item.amount)} ({item.percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Customer Debt Ranking Bar Chart & Debt Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Debt Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Xếp hạng Công nợ Khách hàng</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Biểu đồ thanh ngang so sánh trị giá nợ chưa thu hồi theo khách hàng.</p>
          </div>

          {/* SVG Horizontal Bar Chart */}
          <div className="py-4 overflow-visible">
            <svg className="w-full overflow-visible" viewBox="0 0 550 200">
              {/* Axes lines */}
              <line x1="120" y1="10" x2="120" y2="180" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="120" y1="180" x2="420" y2="180" stroke="#cbd5e1" strokeWidth="1" />

              {/* Grid indicators */}
              <line x1="220" y1="10" x2="220" y2="180" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="320" y1="10" x2="320" y2="180" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="420" y1="10" x2="420" y2="180" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Grid scale labels */}
              <text x="220" y="192" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 font-mono">40M</text>
              <text x="320" y="192" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 font-mono">80M</text>
              <text x="420" y="192" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 font-mono">120M</text>

              {(() => {
                const maxVal = Math.max(...finalCustomerDebt.map(c => c.debtAmount || 0), 120000000) || 120000000;
                return finalCustomerDebt.map((c, idx) => {
                  const barY = 22 + idx * 32;
                  const barWidth = ((c.debtAmount || 0) / maxVal) * 290;

                  // Color scheme based on severity
                  let barColor = "hsl(142, 71%, 45%)"; // Safe Green
                  if (c.debtAmount > 100000000) barColor = "hsl(0, 72%, 51%)"; // Danger Red
                  else if (c.debtAmount > 45000000) barColor = "hsl(38, 92%, 50%)"; // Warning Orange

                  return (
                    <g key={idx}>
                      {/* Y label (Customer Name truncated) */}
                      <text
                        x="110"
                        y={barY + 13}
                        textAnchor="end"
                        className="text-[9px] font-bold fill-slate-600 font-sans"
                      >
                        {c.customerName.length > 18 ? c.customerName.slice(0, 16) + "..." : c.customerName}
                      </text>

                      {/* Bar */}
                      <rect
                        x="121"
                        y={barY}
                        width={Math.max(4, barWidth)}
                        height="20"
                        fill={barColor}
                        rx="0"
                        className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                      />

                      {/* Value label */}
                      <text
                        x={125 + barWidth}
                        y={barY + 13}
                        textAnchor="start"
                        className="text-[8px] font-bold fill-slate-500 font-mono"
                      >
                        {formatMoney(c.debtAmount)}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Customer Overdue Debt Detailed Table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Sổ nợ &amp; Mức độ Rủi ro</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi thời gian trễ thanh toán để xử lý thu hồi công nợ.</p>
          </div>

          <div className="my-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pl-1">Khách hàng</th>
                  <th className="py-2 text-right">Trị giá nợ</th>
                  <th className="py-2 text-right pr-1">Phân loại</th>
                </tr>
              </thead>
              <tbody>
                {finalCustomerDebt.map((item, idx) => {
                  const status = item.debtAmount > 100000000 ? "DANGER" : item.debtAmount > 45000000 ? "WARNING" : "GOOD";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-700 pl-1 truncate max-w-[150px]">
                        {item.customerName}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatMoney(item.debtAmount)}
                      </td>
                      <td className="py-2.5 text-right pr-1 font-bold">
                        {status === "DANGER" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-rose-50 text-rose-600 border border-rose-100">Nợ xấu</span>
                        ) : status === "WARNING" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-50 text-amber-600 border border-amber-100">Cần đòi</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100">An toàn</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-50 pt-3 text-center">
            <button className="text-[10px] text-slate-teal font-extrabold hover:underline inline-flex items-center space-x-1 cursor-pointer bg-transparent border-0">
              <span>Xem Sổ nợ chi tiết &amp; Đặt hạn mức tín dụng</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Box: For Testing WebSocket Notifications */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="websocket-simulator-box">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center font-display">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-teal mr-2 animate-pulse"></span>
            Trình Giả Lập Phát Thông Báo (WebSocket Testing Sandbox)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Sử dụng form này để gửi lệnh mô phỏng thông báo phê duyệt thời gian thực đến broker. Hệ thống sẽ phát trực tiếp qua WebSocket đến tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSimulateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block uppercase">Tiêu đề thông báo</label>
            <input
              type="text"
              value={simTitle}
              onChange={(e) => setSimTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-teal"
              placeholder="Nhập tiêu đề..."
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block uppercase">Nội dung thông báo</label>
            <input
              type="text"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:border-slate-teal"
              placeholder="Nhập nội dung chi tiết..."
              required
            />
          </div>
          <div className="flex items-end space-x-3">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">Loại nghiệp vụ</label>
              <select
                value={simType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSimType(val);
                  if (val === 'ORDER') {
                    setSimTitle("Đề xuất đơn hàng mới chờ duyệt");
                    setSimMessage("Đơn hàng DH-2026-008 vượt ngưỡng trị giá 75,000,000 VND cần Giám đốc ký duyệt số.");
                  } else if (val === 'CONTRACT') {
                    setSimTitle("Đề xuất hợp đồng lao động mới");
                    setSimMessage("Hợp đồng thử việc nhân viên Nguyễn Văn A (Phòng Kế toán) - Mức lương: 15,000,000 VND.");
                  } else if (val === 'LEAVE') {
                    setSimTitle("Đề xuất đơn nghỉ phép chờ duyệt");
                    setSimMessage("Đơn xin nghỉ phép 3 ngày làm việc của nhân viên Lê Thị B (Phòng Sản xuất) lý do việc cá nhân.");
                  } else if (val === 'PRODUCTION_PLAN') {
                    setSimTitle("Dự toán Kế hoạch Sản xuất MTO");
                    setSimMessage("Dự toán Kế hoạch sản xuất KH-2026-08 (10.000 sản phẩm) - Xin rút 450.000.000 VNĐ tiền vải.");
                  } else if (val === 'MATERIAL_EXTRA') {
                    setSimTitle("Yêu cầu Cấp bù Nguyên vật tư");
                    setSimMessage("Sản xuất lỗi rập 40m vải Kaki - Xin duyệt cấp bù 28.000.000 VNĐ tiền vải thay thế.");
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-teal"
              >
                <option value="ORDER">Đơn Hàng Bán (ORDER)</option>
                <option value="CONTRACT">Hợp Đồng Mới (CONTRACT)</option>
                <option value="LEAVE">Nghỉ Phép (LEAVE)</option>
                <option value="PRODUCTION_PLAN">Kế Hoạch Sản Xuất (PRODUCTION_PLAN)</option>
                <option value="MATERIAL_EXTRA">Cấp Bù Vật Tư (MATERIAL_EXTRA)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSimulating}
              className="py-2 px-5 bg-slate-teal hover:bg-slate-teal-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer h-[34px]"
            >
              {isSimulating ? "Đang gửi..." : "Gửi giả lập"}
            </button>
          </div>
        </form>

        {simSuccess && (
          <div className="mt-3 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 p-2.5 rounded-xl font-bold animate-in fade-in duration-200">
            {simSuccess}
          </div>
        )}
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
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-white rounded-xl border border-slate-100">
                      <h5 className="font-bold text-slate-800 text-sm mb-2">{selectedInboxItem.data.title}</h5>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedInboxItem.data.message}</p>
                    </div>
                    {selectedInboxItem.data.createdAt && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Thời gian tạo:</span>
                        <span className="font-mono">{new Date(selectedInboxItem.data.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                    )}
                  </div>

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
                        onClick={handleApproveClick}
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

      {/* Confirmation Modal */}
      {showConfirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={() => setShowConfirmApprove(false)}>
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-slate-teal-light text-slate-teal rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Xác nhận phê duyệt</h3>
            <p className="text-xs text-center text-slate-600 mb-5 leading-relaxed">
              Bạn đang chuẩn bị ký số và phê duyệt <strong>{selectedInboxItem?.data.title || "chứng từ này"}</strong>. Hệ thống sẽ ghi nhận quyết định của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmApprove(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-slate-teal hover:bg-slate-teal-hover text-white font-bold transition-colors shadow-lg shadow-slate-teal/30 text-xs"
              >
                Xác nhận Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
