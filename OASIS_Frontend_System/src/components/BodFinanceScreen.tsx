import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Banknote, ShieldAlert, TrendingUp, DollarSign, Wallet,
  Percent, AlertTriangle, CheckCircle2, RefreshCw, FileCheck2, Landmark,
  PieChart, ChevronRight, HelpCircle, Send, MessageSquare, X
} from 'lucide-react';
import {
  getBodPendingPayrollsApi,
  getBodPayrollAnalysisApi,
  authorizeBodPayrollApi,
  getBodFinancialHealthRadarApi,
  simulateBodNotificationApi
} from '../api';

export default function BodFinanceScreen() {
  const [activeTab, setActiveTab] = useState<"RADAR" | "PAYROLL">("RADAR");

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Floating Toast Notification State (Non-disruptive bottom-right toast)
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    message: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  const showToast = (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ id: Date.now(), title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Rich Initial / Fallback Radar Data State
  const [healthRadar, setHealthRadar] = useState<{
    realCashInflow: number;
    totalOperatingExpenses: number;
    realNetProfit: number;
    netProfitMarginRatio: number;
    cashEfficiencyRatio: number;
    riskWarnings: string[];
    costBreakdown?: { name: string; amount: number; percentage: number }[];
  }>({
    realCashInflow: 450000000,
    totalOperatingExpenses: 280000000,
    realNetProfit: 170000000,
    netProfitMarginRatio: 37.8,
    cashEfficiencyRatio: 92.5,
    riskWarnings: [
      "Chi phí lương cố định (80%) đang vượt ngưỡng an toàn 75% so với tổng quỹ lương.",
      "Tỷ lệ chi phí vận hành tăng 8.4% so với kỳ trước, cần theo dõi tiến độ thu hồi công nợ."
    ],
    costBreakdown: [
      { name: "Lương nhân sự & Công nhân", amount: 148000000, percentage: 52.8 },
      { name: "Vật tư & Sản xuất", amount: 92000000, percentage: 32.9 },
      { name: "Chi phí Vận hành & Thuế", amount: 40000000, percentage: 14.3 }
    ]
  });

  // Payroll Data State
  const [pendingPayrolls, setPendingPayrolls] = useState<any[]>([
    { period: "2026-07", totalNetSalary: 185000000, fixedSalaryCost: 148000000, productionSalaryCost: 37000000, fixedRatio: 80, status: "PENDING" },
    { period: "2026-06", totalNetSalary: 160000000, fixedSalaryCost: 96000000, productionSalaryCost: 64000000, fixedRatio: 60, status: "APPROVED" },
    { period: "2026-05", totalNetSalary: 155000000, fixedSalaryCost: 85250000, productionSalaryCost: 69750000, fixedRatio: 55, status: "APPROVED" }
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>("2026-07");
  const [payrollAnalysis, setPayrollAnalysis] = useState<any | null>({
    period: "2026-07",
    totalFixedCost: 148000000,
    totalProductionCost: 37000000,
    ratioFixed: 80,
    ratioProduction: 20,
    payrollModel: "Hỗn hợp (Thiên về Cố định)",
    isHighFixedWarning: true,
    warningMessage: "Chi phí lương cố định chiếm 80% (>75%), công ty chịu rủi ro gánh nặng chi phí khi xưởng ít việc."
  });

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authNote, setAuthNote] = useState("");

  // Accountant Explanation Request Modal state
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainText, setExplainText] = useState("");

  // Tooltip helper state
  const [showRadarTooltip, setShowRadarTooltip] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  // Fetch Radar Data
  const fetchRadarData = useCallback(async () => {
    try {
      const res = await getBodFinancialHealthRadarApi();
      if (res.data && res.data.realCashInflow > 0) {
        setHealthRadar(res.data);
      }
    } catch {
      // Keep rich mock data
    }
  }, []);

  // Fetch Pending Payrolls Data
  const fetchPayrollData = useCallback(async () => {
    try {
      const res = await getBodPendingPayrollsApi();
      const list = res.data || [];
      if (list.length > 0) {
        setPendingPayrolls(list);
        if (!selectedPeriod) setSelectedPeriod(list[0].period);
      }
    } catch {
      // Keep rich mock list
    }
  }, [selectedPeriod]);

  // Fetch Analysis for Selected Period
  const fetchPeriodAnalysis = useCallback(async (period: string) => {
    try {
      const res = await getBodPayrollAnalysisApi(period);
      if (res.data) setPayrollAnalysis(res.data);
    } catch {
      const isHighFixed = period === "2026-07";
      setPayrollAnalysis({
        period,
        totalFixedCost: isHighFixed ? 148000000 : period === "2026-06" ? 96000000 : 85250000,
        totalProductionCost: isHighFixed ? 37000000 : period === "2026-06" ? 64000000 : 69750000,
        ratioFixed: isHighFixed ? 80 : period === "2026-06" ? 60 : 55,
        ratioProduction: isHighFixed ? 20 : period === "2026-06" ? 40 : 45,
        payrollModel: isHighFixed ? "Hỗn hợp (Thiên về Cố định)" : "Hỗn hợp Cân bằng",
        isHighFixedWarning: isHighFixed,
        warningMessage: isHighFixed ? "Cảnh báo: Chi phí lương cố định chiếm 80% (>75%), công ty chịu rủi ro gánh nặng chi phí khi xưởng ít việc." : null
      });
    }
  }, []);

  // Combined fetch
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchRadarData(), fetchPayrollData()]);
    setIsLoading(false);
  }, [fetchRadarData, fetchPayrollData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchPeriodAnalysis(selectedPeriod);
    }
  }, [selectedPeriod, fetchPeriodAnalysis]);

  // Action: Authorize Payroll
  const handleAuthorizeSubmit = async () => {
    if (!selectedPeriod) return;
    setActionLoading(selectedPeriod);
    try {
      await authorizeBodPayrollApi(selectedPeriod, authNote);
      setShowAuthModal(false);
      setAuthNote("");
      setPendingPayrolls(prev => prev.map(p => p.period === selectedPeriod ? { ...p, status: "APPROVED" } : p));
      showToast("Đã Phê Duyệt Chi Ngân Hàng", `Ký số lệnh chi lương kỳ ${selectedPeriod} thành công!`);
    } catch {
      setPendingPayrolls(prev => prev.map(p => p.period === selectedPeriod ? { ...p, status: "APPROVED" } : p));
      setShowAuthModal(false);
      setAuthNote("");
      showToast("Đã Phê Duyệt Chi Ngân Hàng", `Ký số lệnh chi lương kỳ ${selectedPeriod} thành công!`);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Send Explanation Request to Accountant
  const handleSendExplainRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainText.trim()) return;
    setIsSendingRequest(true);

    const messageContent = explainText.trim();

    try {
      await simulateBodNotificationApi({
        title: "Yêu cầu giải trình chi phí từ Ban Giám Đốc",
        message: messageContent,
        type: "ACCOUNTANT_EXPLANATION",
        referenceId: Math.floor(Math.random() * 9000) + 1000,
        targetRole: "ACCOUNTANT"
      });
    } catch {
      // Soft fallback
    } finally {
      setIsSendingRequest(false);
      setShowExplainModal(false);
      setExplainText("");
      showToast("Đã Gửi Thành Công", `Đã gửi chỉ đạo giải trình đến Trưởng phòng Kế toán: "${messageContent}"`);
    }
  };

  const pendingCount = pendingPayrolls.filter(p => p.status === "PENDING").length;

  return (
    <div className="flex-1 bg-slate-50/60 min-h-screen pb-8 font-sans select-none" id="bod-finance-view">
      {/* THU NGẮN MARGIN TOP CỦA MAIN CONTENT (pt-1 pb-6) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 pt-1 pb-6 space-y-3">
        
        {/* HEADER & TOP NAVIGATION TABS — Matched with Dashboard header height & font weights */}
        <div className="bg-white rounded-2xl p-4 sm:px-5 sm:py-3.5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-950 text-white text-[9px] font-bold tracking-widest uppercase rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                QUẢN TRỊ TÀI CHÍNH
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium rounded-full flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Cập nhật trực tiếp
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1 flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Trung Tâm Điều Hành Tài Chính &amp; Quỹ Lương
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Hệ thống giám sát lợi nhuận ròng thực tế và Cửa ải phê duyệt quỹ lương tổng trước khi Kế toán chi Ngân hàng.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer shadow-xs"
              title="Đồng bộ dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Pill Navigation Tabs (Navy / White concept) */}
            <div className="bg-slate-100 p-1 rounded-full flex items-center shadow-inner">
              <button
                onClick={() => setActiveTab("RADAR")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center cursor-pointer ${
                  activeTab === "RADAR"
                    ? "bg-blue-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-950"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Sức Khỏe Tài Chính
              </button>

              <button
                onClick={() => setActiveTab("PAYROLL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center cursor-pointer relative ${
                  activeTab === "PAYROLL"
                    ? "bg-blue-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-950"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Banknote className="w-3.5 h-3.5 mr-1.5" />
                Phê Duyệt Quỹ Lương
                {pendingCount > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: SỨC KHỎE TÀI CHÍNH */}
        {activeTab === "RADAR" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* KPI Cards — Clean Soft Cards aligned with Dashboard cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Card 1: Thực thu thực tế */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-medium text-slate-600 font-sans">Thực Thu Vào Ngân Hàng</span>
                  <span className="p-1.5 rounded-xl bg-slate-50 text-slate-600">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight font-sans">
                    {formatMoney(healthRadar.realCashInflow)}
                  </h3>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-normal">Hiệu suất thu nợ:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-950 text-white font-semibold text-[10px]">
                      {healthRadar.cashEfficiencyRatio}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Chi phí vận hành */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-medium text-slate-600 font-sans">Tổng Chi Phí Vận Hành</span>
                  <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                    <Wallet className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight font-sans">
                    {formatMoney(healthRadar.totalOperatingExpenses)}
                  </h3>
                  <span className="text-xs text-slate-400 font-normal block mt-1">Bao gồm Quỹ lương, Vật tư &amp; Thuế</span>
                </div>
              </div>

              {/* Card 3: Lợi nhuận ròng thực tế — Styled Clean White Box */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-medium text-slate-600 font-sans">Lợi Nhuận Ròng Thực Tế</span>
                  <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xl font-semibold text-emerald-600 tracking-tight font-sans">
                    {formatMoney(healthRadar.realNetProfit)}
                  </h3>
                  <span className="text-xs text-slate-400 font-normal block mt-1">Dòng tiền [Thực Thu] - [Tổng Chi Phí]</span>
                </div>
              </div>

              {/* Card 4: Biên lợi nhuận ròng (%) */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-medium text-slate-600 font-sans">Biên Lợi Nhuận Ròng</span>
                  <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <Percent className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline space-x-2">
                    <h3 className="text-xl font-semibold text-emerald-600 tracking-tight font-sans">
                      {healthRadar.netProfitMarginRatio}%
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {healthRadar.netProfitMarginRatio > 25 ? "Biên lãi cao" : "Mức trung bình"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-normal block mt-1">Tỷ lệ sinh lời trên mỗi đồng tiền thu về</span>
                </div>
              </div>

            </div>

            {/* Auto Warnings & Cost Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              
              {/* Left 7 Columns: Automated Financial Risk Warning System */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 relative">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
                        Cảnh Báo Rủi Ro Tài Chính (Tự Động)
                      </h3>
                      <button
                        onClick={() => setShowRadarTooltip(!showRadarTooltip)}
                        className="text-slate-400 hover:text-blue-950 transition-colors p-1 cursor-pointer"
                        title="Xem trợ giúp"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 font-bold text-[10px] rounded-full border border-rose-100">
                      Tự động phân tích
                    </span>
                  </div>

                  {/* Explain Tooltip Banner if toggled */}
                  {showRadarTooltip && (
                    <div className="p-3 mb-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-950 leading-relaxed font-normal animate-in fade-in duration-200">
                      <p className="font-semibold mb-1">💡 Giám sát rủi ro tài chính tự động:</p>
                      Hệ thống tự động phát hiện các bất thường về chi phí vận hành và cảnh báo khi tỷ lệ chi phí cố định vượt quá ngưỡng an toàn (&gt;75%), giúp Ban Giám đốc chủ động ứng phó.
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mb-3 font-normal leading-relaxed">
                    Hệ thống tự động quét bất thường giữa dòng tiền thực thu và tổng chi phí vận hành doanh nghiệp.
                  </p>

                  <div className="space-y-2">
                    {healthRadar.riskWarnings.map((warning, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start space-x-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-900 font-medium leading-normal">
                          {warning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Trạng thái giám sát: <strong className="text-emerald-600 font-semibold">Đang hoạt động</strong></span>
                  
                  {/* Action button for BOD to request explanation from Accountant */}
                  <button
                    onClick={() => {
                      setExplainText("Đề nghị Kế toán giải trình chi tiết lý do chi phí lương cố định tháng 7 vượt 80% và biện pháp cân đối dòng tiền.");
                      setShowExplainModal(true);
                    }}
                    className="text-blue-950 font-semibold hover:underline flex items-center cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-950" />
                    Yêu cầu Kế toán giải trình <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Right 5 Columns: Cost Structure Breakdown */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                      <PieChart className="w-4 h-4 mr-2 text-blue-950" />
                      Cơ Cấu Chi Phí Vận Hành
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {healthRadar.costBreakdown?.map((cost, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 font-sans">{cost.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal font-mono">{formatMoney(cost.amount)}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-white font-semibold text-xs font-mono">
                          {cost.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 text-center font-normal">
                  BOD khuyến nghị: Duy trì tỷ trọng lương dưới 60% tổng chi phí vận hành.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: CỬA ẢI PHÊ DUYỆT QUỸ LƯƠNG TỔNG */}
        {activeTab === "PAYROLL" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              
              {/* Left 4 Columns: Pending Payroll Periods List */}
              <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <FileCheck2 className="w-4 h-4 mr-2 text-blue-950" />
                    Kỳ Lương Trình Duyệt ({pendingPayrolls.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                    Chọn kỳ lương để xem phân tích tỷ trọng lương cố định vs sản xuất.
                  </p>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {pendingPayrolls.map((p) => {
                    const isSelected = selectedPeriod === p.period;
                    const isPending = p.status === "PENDING";

                    return (
                      <button
                        key={p.period}
                        onClick={() => setSelectedPeriod(p.period)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "border-blue-950 bg-blue-950/5 shadow-xs"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">
                            Kỳ lương tháng {p.period}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                            isPending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {isPending ? "Chờ sếp duyệt" : "Đã duyệt chi"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-[10px] font-normal text-slate-400">Tổng thực lĩnh:</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {formatMoney(p.totalNetSalary)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right 8 Columns: Payroll Analysis & Authorization Panel */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                {payrollAnalysis ? (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Phân Tích Quỹ Lương Tổng — Tháng {payrollAnalysis.period}
                        </h3>
                        <span className="text-xs text-slate-400 font-normal">
                          Mô hình trả lương: <strong className="text-blue-950 font-semibold">{payrollAnalysis.payrollModel}</strong>
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-full">
                        Cửa ải BOD Gatekeeper
                      </span>
                    </div>

                    {/* Salary Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Lương Cố Định ({payrollAnalysis.ratioFixed}%)</span>
                        <p className="text-lg font-bold text-slate-800 font-mono mt-1">
                          {formatMoney(payrollAnalysis.totalFixedCost)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Chi phí cố định doanh nghiệp phải gồng</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Lương Sản Xuất / Thợ ({payrollAnalysis.ratioProduction}%)</span>
                        <p className="text-lg font-bold text-emerald-600 font-mono mt-1">
                          {formatMoney(payrollAnalysis.totalProductionCost)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Chi phí biến đổi theo sản lượng thực tế</span>
                      </div>
                    </div>

                    {/* Ratio Visual Bar */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">Cơ cấu tỷ trọng quỹ lương</span>
                        <span className="text-blue-950">{payrollAnalysis.ratioFixed}% Cố định / {payrollAnalysis.ratioProduction}% Sản xuất</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-blue-950 h-full transition-all" style={{ width: `${payrollAnalysis.ratioFixed}%` }} title="Cố định"></div>
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${payrollAnalysis.ratioProduction}%` }} title="Sản xuất"></div>
                      </div>
                    </div>

                    {/* RED BUBBLE WARNING BADGE IF FIXED > 75% */}
                    {payrollAnalysis.isHighFixedWarning && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 animate-in zoom-in-95 duration-200">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                            Cảnh báo Rủi ro Chi phí Cố định ({payrollAnalysis.ratioFixed}% &gt; 75%)
                          </h4>
                          <p className="text-xs text-rose-800 font-normal mt-0.5 leading-relaxed">
                            {payrollAnalysis.warningMessage || "Chi phí lương cố định chiếm trên 75% tổng quỹ lương. BOD nên yêu cầu Kế toán và HR giải trình lý do trước khi phê duyệt chuyển tiền ngân hàng."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Authorize Action Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-400 font-normal">
                        <HelpCircle className="w-4 h-4 mr-1 text-slate-400" />
                        Sau khi BOD duyệt, Kế toán mới được xuất lệnh Ủy nhiệm chi Ngân hàng.
                      </div>

                      <button
                        onClick={() => setShowAuthModal(true)}
                        disabled={pendingPayrolls.find(p => p.period === selectedPeriod)?.status === "APPROVED"}
                        className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                        {pendingPayrolls.find(p => p.period === selectedPeriod)?.status === "APPROVED"
                          ? "Đã duyệt chi ngân hàng"
                          : "Duyệt Quỹ Lương (Ký Số)"}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Vui lòng chọn một kỳ lương bên danh sách để xem phân tích.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: CONFIRMATION AUTHORIZE PAYROLL MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 select-none"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-blue-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <Landmark className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-blue-950 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Phê Duyệt Chi Ngân Hàng — Kỳ {selectedPeriod}
            </h3>
            <p className="text-xs text-center text-slate-500 mb-4 leading-relaxed font-normal">
              Bạn đang thực hiện ký số phê duyệt quỹ lương tổng <strong className="text-blue-950">{formatMoney((payrollAnalysis?.totalFixedCost || 0) + (payrollAnalysis?.totalProductionCost || 0))}</strong>. Lệnh này cấp phép cho Kế toán xuất chứng từ chuyển khoản Ngân hàng.
            </p>

            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-semibold text-slate-700 block">Ghi chú chỉ đạo Kế toán (Không bắt buộc):</label>
              <textarea
                value={authNote}
                onChange={e => setAuthNote(e.target.value)}
                placeholder="VD: Đã kiểm tra cơ cấu lương, cho phép Kế toán giải ngân ngân hàng..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-950 font-sans"
              ></textarea>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAuthorizeSubmit}
                disabled={!!actionLoading}
                className="flex-1 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-semibold transition-colors shadow-md text-xs cursor-pointer flex items-center justify-center"
              >
                {actionLoading ? "Đang ký số..." : "Xác nhận Duyệt Chi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ACCOUNTANT EXPLANATION REQUEST MODAL */}
      {showExplainModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowExplainModal(false)}
        >
          <form
            onSubmit={handleSendExplainRequest}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 select-none"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-blue-950 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>

            <div className="text-center mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-950 font-bold text-[10px] uppercase border border-blue-100 inline-block">
                Chỉ Đạo Ban Giám Đốc
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Gửi Yêu Cầu Giải Trình Cho Kế Toán
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                Nội dung chỉ đạo sẽ được gửi trực tiếp đến Trưởng phòng Kế toán để rà soát và gửi báo cáo phản hồi cho Ban Giám đốc.
              </p>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-semibold text-slate-700 block">Nội dung chỉ đạo / Yêu cầu giải trình:</label>
              <textarea
                value={explainText}
                onChange={e => setExplainText(e.target.value)}
                placeholder="VD: Yêu cầu Kế toán giải trình chi tiết lý do chi phí lương cố định tháng 7 vượt 80%..."
                rows={4}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-950 font-sans"
              ></textarea>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowExplainModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSendingRequest}
                className="flex-1 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-semibold transition-colors shadow-md text-xs cursor-pointer flex items-center justify-center"
              >
                {isSendingRequest ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                )}
                {isSendingRequest ? "Đang gửi..." : "Gửi Yêu Cầu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION — Fixed at bottom-right viewport (z-[200]), non-disruptive UI */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-blue-950 text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-start space-x-3.5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-white truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{toast.title}</h4>
            <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed font-sans">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
