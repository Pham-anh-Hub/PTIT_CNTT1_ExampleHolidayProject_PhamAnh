import { useState, useTransition } from "react";
import { 
  Calculator, Receipt, DollarSign, RefreshCw, CheckSquare, 
  FileSpreadsheet, TrendingUp, UserCheck, Coins, ArrowUpRight, 
  Check, AlertCircle, Warehouse, Settings, Percent, Download, 
  ChevronRight, Users, CreditCard, Building, Info 
} from "lucide-react";
import { Employee, Contract, SalesOrder, MaterialImport, FinishedProductImport, SupplierPayable } from "../types";
import { SAMPLE_MATERIALS, SAMPLE_PRODUCTS } from "../data";

interface AccountantScreenProps {
  employees: Employee[];
  contracts: Contract[];
  orders: SalesOrder[];
  materialImports: MaterialImport[];
  onAddMaterialImport: (imp: MaterialImport) => void;
  finishedImports: FinishedProductImport[];
  onAddFinishedImport: (fimp: FinishedProductImport) => void;
  supplierPayables: SupplierPayable[];
  onUpdateSupplierPayable: (supplierId: string, amountToPay: number) => void;
  corporateTaxRate: number;
  onUpdateTaxRate: (rate: number) => void;
  onUpdateOrdersPayment?: (orderId: string, isPaid: boolean) => void;
  onSyncDataToBOD?: () => void;
  onPublishPayslips?: () => void;
}

// Piece-rate tasks for thợ wait for Accountant check
interface PieceRateTask {
  id: string;
  workerId: string;
  workerName: string;
  workerCode: string;
  stageName: string;
  quantity: number;
  unitWage: number;
  totalWage: number;
  status: "PENDING" | "APPROVED";
  date: string;
}

const INITIAL_PIECE_TASKS: PieceRateTask[] = [
  { id: "task-1", workerId: "emp-6", workerName: "Nguyễn Công Binh", workerCode: "GV-006", stageName: "Chà nhám mặt bàn SP-BAS-01", quantity: 15, unitWage: 120000, totalWage: 1800000, status: "APPROVED", date: "2026-07-08" },
  { id: "task-2", workerId: "emp-6", workerName: "Nguyễn Công Binh", workerCode: "GV-006", stageName: "Sơn lót & PU tủ SP-TQA-04", quantity: 10, unitWage: 150000, totalWage: 1500000, status: "APPROVED", date: "2026-07-07" },
  { id: "task-3", workerId: "emp-101", workerName: "Lê Văn Đạt", workerCode: "GV-101", stageName: "Lắp ráp hộc kéo SP-KSA-05", quantity: 11, unitWage: 50000, totalWage: 550000, status: "PENDING", date: "2026-07-08" },
  { id: "task-4", workerId: "emp-6", workerName: "Nguyễn Công Binh", workerCode: "GV-006", stageName: "Hàn khung sắt SP-BNS-02", quantity: 8, unitWage: 180000, totalWage: 1440000, status: "PENDING", date: "2026-07-08" },
  { id: "task-5", workerId: "emp-101", workerName: "Lê Văn Đạt", workerCode: "GV-101", stageName: "Đóng gói bọc xốp tủ SP-TQA-04", quantity: 20, unitWage: 30000, totalWage: 600000, status: "PENDING", date: "2026-07-08" },
];

export default function AccountantScreen({
  employees,
  contracts,
  orders,
  materialImports,
  onAddMaterialImport,
  finishedImports,
  onAddFinishedImport,
  supplierPayables,
  onUpdateSupplierPayable,
  corporateTaxRate,
  onUpdateTaxRate,
  onSyncDataToBOD,
  onPublishPayslips
}: AccountantScreenProps) {
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"payroll" | "imports" | "debts" | "financials">("payroll");
  const [pieceTasks, setPieceTasks] = useState<PieceRateTask[]>(INITIAL_PIECE_TASKS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [publishedEmployees, setPublishedEmployees] = useState<Record<string, boolean>>({});
  
  // Selected employee for detailed payslip modal
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<any | null>(null);

  // Client debts state (with client payments recordable)
  const [clientDebts, setClientDebts] = useState([
    { id: "debt-1", client: "Nội Thất Nhà Xinh", debt: 120000000, originalDebt: 120000000, paid: 120000000, days: 45, status: "GOOD" },
    { id: "debt-2", client: "Xây dựng Hoà Bình", debt: 95000000, originalDebt: 150000000, paid: 55000000, days: 32, status: "DANGER" },
    { id: "debt-3", client: "Tập đoàn SunGroup", debt: 82000000, originalDebt: 182000000, paid: 100000000, days: 14, status: "WARNING" },
    { id: "debt-4", client: "Gỗ Mỹ Nghệ Âu Lạc", debt: 45000000, originalDebt: 95000000, paid: 50000000, days: 5, status: "WARNING" },
    { id: "debt-5", client: "Showroom Tân Cổ Điển", debt: 0, originalDebt: 50000000, paid: 50000000, days: 0, status: "GOOD" }
  ]);

  const [paymentAmount, setPaymentAmount] = useState<Record<string, string>>({});
  const [supplierPayAmount, setSupplierPayAmount] = useState<Record<string, string>>({});

  // Cash Inflows logger
  const [customInflows, setCustomInflows] = useState<any[]>([
    { id: "inf-1", code: "PT-001", source: "Nội Thất Nhà Xinh", amount: 120000000, type: "THU_CONG_NO", date: "2026-07-02", note: "Thu hồi nợ đơn hàng ĐH-001" },
    { id: "inf-2", code: "PT-002", source: "Gỗ Mỹ Nghệ Âu Lạc", amount: 50000000, type: "THU_CONG_NO", date: "2026-07-06", note: "Thanh toán đợt 1 ĐH-004" },
    { id: "inf-3", code: "PT-003", source: "Xây dựng Hoà Bình", amount: 55000000, type: "THU_CONG_NO", date: "2026-07-08", note: "Tạm ứng hợp đồng ĐH-002" }
  ]);

  const handleApproveTask = (id: string) => {
    setPieceTasks(prev => prev.map(t => t.id === id ? { ...t, status: "APPROVED" } : t));
  };

  const handleApproveAllTasks = () => {
    setPieceTasks(prev => prev.map(t => ({ ...t, status: "APPROVED" })));
  };

  const handlePublishSalary = (empId: string) => {
    setPublishedEmployees(prev => ({ ...prev, [empId]: true }));
    if (onPublishPayslips) {
      onPublishPayslips();
    }
  };

  const handleRecordClientPayment = (id: string) => {
    const amountStr = paymentAmount[id];
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return;

    setClientDebts(prev => prev.map(d => {
      if (d.id === id) {
        const nextPaid = d.paid + amount;
        const nextDebt = Math.max(0, d.originalDebt - nextPaid);
        return {
          ...d,
          paid: nextPaid,
          debt: nextDebt,
          status: nextDebt === 0 ? "GOOD" : nextDebt > 80000000 ? "DANGER" : "WARNING"
        };
      }
      return d;
    }));

    // Record as cash inflow
    const target = clientDebts.find(d => d.id === id);
    if (target) {
      const newInflow = {
        id: `inf-${Date.now()}`,
        code: `PT-${Math.floor(100 + Math.random() * 900)}`,
        source: target.client,
        amount: amount,
        type: "THU_CONG_NO",
        date: new Date().toISOString().split('T')[0],
        note: `Thu hồi công nợ từ ${target.client}`
      };
      setCustomInflows(prev => [newInflow, ...prev]);
    }

    setPaymentAmount(prev => ({ ...prev, [id]: "" }));
    alert(`Đã lập Phiếu Thu ghi nhận số tiền ${amount.toLocaleString()}đ từ khách hàng.`);
  };

  const handleRecordSupplierPayment = (id: string) => {
    const amountStr = supplierPayAmount[id];
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return;

    onUpdateSupplierPayable(id, amount);
    setSupplierPayAmount(prev => ({ ...prev, [id]: "" }));
    alert(`Đã lập Phiếu Chi thanh toán ${amount.toLocaleString()}đ cho nhà cung cấp.`);
  };

  const handleSyncToBOD = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      if (onSyncDataToBOD) {
        onSyncDataToBOD();
      }
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1500);
  };

  // 1. DYNAMIC SALARY CALCULATOR
  const computedPayrollList = employees.map(emp => {
    // Basic salary from contract or default
    const contract = contracts.find(c => c.employeeId === emp.id && c.status === "APPROVED");
    const basic = contract ? contract.basicSalary : 6500000;
    
    // Piece-rate earnings of worker (sum of approved tasks for this employee)
    const workerTasks = pieceTasks.filter(t => t.workerId === emp.id && t.status === "APPROVED");
    const pieceEarnings = workerTasks.reduce((sum, t) => sum + t.totalWage, 0);

    // Default allowances
    const allowances = emp.positionId === "WORKER" ? 800000 : 1500000; // Xăng xe, ăn trưa
    
    // Insurances (BHXH - 10.5% of basic salary)
    const bhxh = Math.round(basic * 0.105);

    // Personal Income Tax (PIT - Thuế TNCN)
    // Formula: Taxable Income = Gross (Basic + Piece + Allowance) - BHXH - 11M (standard self-deduction)
    const gross = basic + pieceEarnings + allowances;
    const taxable = gross - bhxh - 11000000;
    let pit = 0;
    if (taxable > 0) {
      // 5% for first bracket
      pit = Math.round(taxable * 0.05);
    }

    const netPay = gross - bhxh - pit;

    return {
      id: emp.id,
      name: emp.fullname,
      code: emp.code,
      position: emp.positionId,
      basic,
      pieceEarnings,
      allowances,
      bhxh,
      pit,
      netPay,
      tasks: workerTasks
    };
  });

  const totalEmployeeWagesSum = computedPayrollList.reduce((sum, item) => sum + item.netPay, 0);

  // 2. FINANCIAL REVENUE DETAILS
  const approvedOrders = orders.filter(o => o.status === "APPROVED");
  const salesRevenueSum = approvedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  // Calculate VAT 10% on sales
  const salesVatOutput = Math.round(salesRevenueSum * 0.1);
  const netSalesRevenue = salesRevenueSum - salesVatOutput;

  // 3. MATERIAL COSTS
  const materialCostSum = materialImports.reduce((sum, imp) => sum + imp.totalAmount, 0);

  // 4. CASHFLOW INFLOWS TOTAL
  const cashInflowCollected = customInflows.reduce((sum, inf) => sum + inf.amount, 0);

  // 5. TAX-AWARE PROFIT ENGINE
  const otherOverheadCosts = 15000000; // Fixed operational costs (power, water, rents)
  const totalCorporateExpenses = materialCostSum + totalEmployeeWagesSum + otherOverheadCosts;
  const corporateProfitBeforeTax = netSalesRevenue - totalCorporateExpenses;
  const corporateIncomeTax = corporateProfitBeforeTax > 0 ? Math.round(corporateProfitBeforeTax * (corporateTaxRate / 100)) : 0;
  const netProfitAfterTax = corporateProfitBeforeTax - corporateIncomeTax;

  const pendingTasksCount = pieceTasks.filter(t => t.status === "PENDING").length;
  const totalClientDebtValue = clientDebts.reduce((sum, d) => sum + d.debt, 0);
  const totalSupplierDebtValue = supplierPayables.reduce((sum, s) => sum + s.remainingAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" id="accountant-dashboard-view">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center">
            <Calculator className="w-5.5 h-5.5 text-slate-teal mr-2" />
            Phân Hệ Tài Chính - Kế Toán Doanh Nghiệp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý bảng tính lương công nhân, đối soát vật tư nhập kho, chi tiết dòng tiền vào, thu hồi công nợ và quyết toán thuế thu nhập doanh nghiệp.
          </p>
        </div>
        
        {/* Tax Rate & Sync Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-xs">
            <Percent className="w-4 h-4 text-slate-teal" />
            <span className="text-xs font-bold text-slate-600">Thuế TNDN (CIT):</span>
            <input
              type="number"
              value={corporateTaxRate}
              onChange={(e) => onUpdateTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-12 text-xs font-mono font-bold text-slate-teal border-b border-slate-300 focus:outline-none text-center"
            />
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>

          <button
            onClick={handleSyncToBOD}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer ${
              syncSuccess 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-teal hover:bg-slate-teal-dark text-white"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Đang truyền số liệu..." : syncSuccess ? "Đồng bộ BOD thành công! ✓" : "Đồng bộ số liệu lên BOD"}</span>
          </button>
        </div>
      </div>

      {/* Corporate Financial Health Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu Thuần</span>
            <span className="p-1 rounded-lg bg-slate-50 text-slate-teal">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-slate-800 mt-2">
            {netSalesRevenue.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[9px] text-slate-400 block mt-1">
            Đã trừ {salesVatOutput.toLocaleString()}đ thuế VAT (10%)
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Chi Phí Hợp Lý</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-500">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-rose-600 mt-2">
            {totalCorporateExpenses.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[9px] text-slate-400 block mt-1">
            Gồm Vật tư + Nhân công + Vận hành
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thuế TNDN Dự Tính</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-500">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-amber-600 mt-2">
            {corporateIncomeTax.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[9px] text-amber-500 font-medium block mt-1">
            Thuế áp dụng mức {corporateTaxRate}%
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Nhuận Ròng Sau Thuế</span>
            <span className={`p-1 rounded-lg ${netProfitAfterTax > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className={`text-lg font-bold font-mono mt-2 ${netProfitAfterTax > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {netProfitAfterTax.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[9px] text-slate-400 block mt-1">
            Lợi nhuận ròng thực giữ lại
          </span>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-400 gap-1 bg-slate-50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("payroll")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "payroll" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lương &amp; Nhân Sự ({computedPayrollList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("imports")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "imports" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-700"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Nhật Ký Nhập Kho ({materialImports.length + finishedImports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "debts" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-700"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Chi Tiết Công Nợ ({clientDebts.length + supplierPayables.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "financials" ? "bg-white text-slate-teal shadow-xs font-bold" : "hover:text-slate-700"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Báo Cáo Tài Chính &amp; Thuế</span>
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      {activeTab === "payroll" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="payroll-tab-content">
          {/* Piece-rate verify queue - 5 columns */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center">
                  <UserCheck className="w-4 h-4 text-slate-teal mr-1.5" />
                  Đối Soát Lương Sản Phẩm Thợ
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Phê duyệt sản phẩm đã đạt KCS để tính tiền công thợ</p>
              </div>
              {pendingTasksCount > 0 && (
                <button
                  onClick={handleApproveAllTasks}
                  className="text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer"
                >
                  Duyệt tất cả
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pieceTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-xl border transition-all flex justify-between items-start ${
                    task.status === "APPROVED" 
                      ? "bg-slate-50/50 border-slate-100" 
                      : "bg-white border-amber-100 shadow-xs hover:border-amber-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-slate-700">{task.workerName}</span>
                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-mono">{task.workerCode}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{task.stageName}</p>
                    <div className="flex items-center space-x-3 text-[9px] text-slate-400 font-mono">
                      <span>SL: <strong className="text-slate-600">{task.quantity}</strong></span>
                      <span>Đơn giá: {task.unitWage.toLocaleString("vi-VN")}đ</span>
                      <span>{task.date}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1.5">
                    <span className="text-[10px] font-bold font-mono text-slate-800">{task.totalWage.toLocaleString("vi-VN")} đ</span>
                    {task.status === "APPROVED" ? (
                      <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded flex items-center">
                        <Check className="w-2.5 h-2.5 mr-0.5" /> Đã duyệt
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveTask(task.id)}
                        className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        Duyệt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100/40 text-[9px] text-amber-800 leading-normal flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Quy trình đối soát:</strong> Dữ liệu thợ gỗ được chuyển tự động từ bảng nghiệm thu của Quản đốc xưởng. Lương khoán chỉ cộng vào phiếu lương sau khi kế toán duyệt.
              </span>
            </div>
          </div>

          {/* Dynamic employee payroll table - 7 columns */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 text-slate-teal mr-1.5" />
                  Bảng Tính Chi Tiết Lương Nhân Viên (Tháng Hiện Tại)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Tính toán tự động theo hợp đồng gốc, lương sản lượng và thuế TNCN khấu trừ</p>
              </div>
              <button className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 px-2.5 py-1 rounded flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>Xuất Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-3">Họ Tên / Code</th>
                    <th className="py-2.5 px-1 text-right">Lương Cơ Bản</th>
                    <th className="py-2.5 px-1 text-right">Lương Khoán</th>
                    <th className="py-2.5 px-1 text-right">Khấu Trừ BHXH</th>
                    <th className="py-2.5 px-1 text-right">Thực Nhận</th>
                    <th className="py-2.5 px-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {computedPayrollList.map((emp) => {
                    const isPublished = publishedEmployees[emp.id];
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">{emp.name}</span>
                          <span className="text-[8px] text-slate-400 font-mono">{emp.code} • {emp.position}</span>
                        </td>
                        <td className="py-3 px-1 text-right font-mono font-medium text-slate-500">{emp.basic.toLocaleString()}đ</td>
                        <td className="py-3 px-1 text-right font-mono text-emerald-600 font-semibold">+{emp.pieceEarnings.toLocaleString()}đ</td>
                        <td className="py-3 px-1 text-right font-mono text-rose-500">-{emp.bhxh.toLocaleString()}đ</td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-slate-800">{emp.netPay.toLocaleString()}đ</td>
                        <td className="py-3 px-3 text-center space-x-1 flex justify-center">
                          <button
                            onClick={() => setSelectedPayslipEmp(emp)}
                            className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                          >
                            Xem Phiếu
                          </button>
                          <button
                            onClick={() => handlePublishSalary(emp.id)}
                            className={`text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                              isPublished 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : "bg-slate-teal hover:bg-slate-teal-dark text-white"
                            }`}
                          >
                            {isPublished ? "Đã gửi ✓" : "Gửi"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center">
                <Info className="w-3.5 h-3.5 text-slate-teal mr-1 shrink-0" />
                Mức bảo hiểm xã hội bắt buộc đóng là 10.5% mức lương cơ bản (NLĐ đóng).
              </span>
              <span className="text-[9px] text-slate-400 italic">Tổng quỹ lương: {totalEmployeeWagesSum.toLocaleString()} đ</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "imports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="imports-tab-content">
          {/* Raw Material Imports Log (6 columns) */}
          <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center">
                  <Warehouse className="w-4 h-4 text-slate-teal mr-1.5" />
                  Nhật Ký Nhập Kho Nguyên Vật Tư
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Các khoản chi nhập gỗ, sơn và linh phụ kiện kim khí sản xuất</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                Cộng chi phí vật tư: {materialCostSum.toLocaleString()} đ
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold border-b border-slate-100">
                    <th className="p-3">Mã PNK</th>
                    <th className="p-3">Vật tư / NCC</th>
                    <th className="p-3 text-right">SL nhập</th>
                    <th className="p-3 text-right">Tổng tiền</th>
                    <th className="p-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px]">
                  {materialImports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-teal">{imp.code}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-700">{imp.materialName}</div>
                        <div className="text-[9px] text-slate-400">{imp.supplier} • {imp.importDate}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{imp.quantity.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">{imp.totalAmount.toLocaleString()}đ</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Đã vào kho
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Finished Product Receipts Log (6 columns) */}
          <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center">
                <CheckSquare className="w-4 h-4 text-slate-teal mr-1.5" />
                Sản Phẩm Đã Nghiệm Thu Nhập Kho Thành Phẩm
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhật ký nhập kho các sản phẩm cơ khí, mộc hoàn thiện đạt chuẩn xuất xưởng</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold border-b border-slate-100">
                    <th className="p-3">Mã phiếu</th>
                    <th className="p-3">Thành phẩm / Kế hoạch</th>
                    <th className="p-3 text-right">SL nhập</th>
                    <th className="p-3 text-center">Chất lượng QA</th>
                    <th className="p-3">Người KCS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px]">
                  {finishedImports.map((fimp) => (
                    <tr key={fimp.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-teal">{fimp.code}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-700">{fimp.productName}</div>
                        <div className="text-[9px] text-slate-400">Lệnh: {fimp.planCode} • {fimp.importDate}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{fimp.quantity} {fimp.unit}</td>
                      <td className="p-3 text-center">
                        {fimp.qaStatus === "PASSED" ? (
                          <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-2 py-0.5 rounded-full">
                            Đạt chuẩn QA
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-600 text-[8px] font-bold px-2 py-0.5 rounded-full">
                            Lỗi kỹ thuật
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{fimp.operatorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "debts" && (
        <div className="space-y-6 animate-in fade-in duration-200" id="debts-tab-content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Customer Debts (Receivables - 6 columns) */}
            <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center">
                  <Receipt className="w-4 h-4 text-slate-teal mr-1.5" />
                  Công Nợ Phải Thu Khách Hàng (Receivables)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Tiền nợ từ đơn hàng bán nội thất, thiết bị gỗ</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                      <th className="py-2.5 px-3">Đối tác</th>
                      <th className="py-2.5 px-1 text-right">Dư Nợ Phải Thu</th>
                      <th className="py-2.5 px-1 text-right">Đã Thu</th>
                      <th className="py-2.5 px-3 text-center">Hành động thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {clientDebts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">{item.client}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                            item.status === "DANGER" ? "bg-red-50 text-red-600" :
                            item.status === "WARNING" ? "bg-amber-50 text-amber-600" :
                            "bg-emerald-50 text-emerald-600"
                          }`}>
                            {item.status === "DANGER" ? `Quá hạn ${item.days} ngày` :
                             item.status === "WARNING" ? `Trễ hạn ${item.days} ngày` : "An toàn"}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-slate-800">
                          {item.debt.toLocaleString()} đ
                        </td>
                        <td className="py-3 px-1 text-right font-mono text-emerald-600">
                          +{item.paid.toLocaleString()} đ
                        </td>
                        <td className="py-3 px-3">
                          {item.debt > 0 ? (
                            <div className="flex items-center space-x-1 justify-center">
                              <input
                                type="number"
                                placeholder="VNĐ"
                                value={paymentAmount[item.id] || ""}
                                onChange={(e) => setPaymentAmount(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-20 border border-slate-200 text-[10px] rounded px-1 py-0.5 font-mono text-right"
                              />
                              <button
                                onClick={() => handleRecordClientPayment(item.id)}
                                className="bg-slate-teal hover:bg-slate-teal-dark text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                Thu
                              </button>
                            </div>
                          ) : (
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full block text-center">
                              Tất toán ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-bold">
                Tổng công nợ khách hàng: {totalClientDebtValue.toLocaleString()} đ
              </div>
            </div>

            {/* Supplier Debts (Payables - 6 columns) */}
            <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center">
                  <Building className="w-4 h-4 text-slate-teal mr-1.5" />
                  Công Nợ Phải Trả Nhà Cung Cấp (Payables)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Tiền nợ mua gỗ và phụ liệu gỗ gối đầu từ nhà cung cấp</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400">
                      <th className="py-2.5 px-3">Nhà Cung Cấp</th>
                      <th className="py-2.5 px-1 text-right">Tổng Khoản Nợ</th>
                      <th className="py-2.5 px-1 text-right font-semibold">Đã Trả</th>
                      <th className="py-2.5 px-3 text-center">Hành động trả nợ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {supplierPayables.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">{item.supplierName}</span>
                          <span className="text-[8px] text-slate-400 block">Hạn trả: {item.dueDate}</span>
                        </td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-slate-800">
                          {item.remainingAmount.toLocaleString()} đ
                        </td>
                        <td className="py-3 px-1 text-right font-mono text-slate-500">
                          {item.paidAmount.toLocaleString()} đ
                        </td>
                        <td className="py-3 px-3">
                          {item.remainingAmount > 0 ? (
                            <div className="flex items-center space-x-1 justify-center">
                              <input
                                type="number"
                                placeholder="VNĐ"
                                value={supplierPayAmount[item.id] || ""}
                                onChange={(e) => setSupplierPayAmount(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-20 border border-slate-200 text-[10px] rounded px-1 py-0.5 font-mono text-right"
                              />
                              <button
                                onClick={() => handleRecordSupplierPayment(item.id)}
                                className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                Chi trả
                              </button>
                            </div>
                          ) : (
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full block text-center">
                              Đã trả hết ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-bold">
                Tổng nợ NCC phải trả: {totalSupplierDebtValue.toLocaleString()} đ
              </div>
            </div>
          </div>

          {/* Sales Revenue Analysis (Detail sales by product) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-4 h-4 text-slate-teal mr-1.5" />
                Chi Tiết Doanh Thu Bán Hàng &amp; Thuế Giá Trị Gia Tăng (VAT)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Bảng phân tích doanh số từ các đơn đặt hàng đã được xuất xưởng thành công</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold border-b border-slate-100">
                    <th className="p-3">Mã Đơn hàng</th>
                    <th className="p-3">Khách hàng / Ngày</th>
                    <th className="p-3">Nội dung đơn hàng</th>
                    <th className="p-3 text-right">Tổng thanh toán (Gross)</th>
                    <th className="p-3 text-right">Thuế VAT đầu ra (10%)</th>
                    <th className="p-3 text-right">Doanh thu thuần (Net)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {approvedOrders.map((order) => {
                    const gross = order.totalAmount;
                    const vat = Math.round(gross * 0.1);
                    const net = gross - vat;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-teal">{order.code}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-700">{order.customerName}</div>
                          <div className="text-[9px] text-slate-400">{order.orderDate}</div>
                        </td>
                        <td className="p-3 text-slate-500 font-medium">
                          {order.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">{gross.toLocaleString()}đ</td>
                        <td className="p-3 text-right font-mono text-rose-500">{vat.toLocaleString()}đ</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">{net.toLocaleString()}đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "financials" && (
        <div className="space-y-6 animate-in fade-in duration-200" id="financials-tab-content">
          {/* General Cash Flow (Inflows) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center">
                <DollarSign className="w-4 h-4 text-slate-teal mr-1.5" />
                Quản Lý Dòng Tiền Đầu Vào Thực Tế (General Cash Inflows)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Ghi nhận các dòng tiền thực nhận chảy vào tài khoản ngân hàng và két quỹ của doanh nghiệp</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold border-b border-slate-100">
                    <th className="p-3">Mã PT</th>
                    <th className="p-3">Nguồn tiền thực nhận</th>
                    <th className="p-3">Phân loại nguồn thu</th>
                    <th className="p-3">Ngày nhận</th>
                    <th className="p-3">Diễn giải nội dung</th>
                    <th className="p-3 text-right">Số tiền mặt/Chuyển khoản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {customInflows.map((inf) => (
                    <tr key={inf.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-teal">{inf.code}</td>
                      <td className="p-3 font-bold text-slate-700">{inf.source}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-2 py-0.5 rounded">
                          {inf.type === "THU_CONG_NO" ? "THU HỒI CÔNG NỢ" : "BÁN HÀNG TRỰC TIẾP"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{inf.date}</td>
                      <td className="p-3 text-slate-500 font-medium">{inf.note}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">+{inf.amount.toLocaleString()}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right text-xs font-bold text-slate-700">
              Tổng Quỹ Tiền Mặt Đầu Vào Thực Thu: <span className="font-mono text-emerald-600 text-sm font-black">{cashInflowCollected.toLocaleString()} đ</span>
            </div>
          </div>

          {/* Tax-Aware Corporate Income Statement */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <FileSpreadsheet className="w-5 h-5 text-slate-teal mr-2" />
                Báo Cáo Kết Quả Hoạt Động Kinh Doanh &amp; Quyết Toán Thuế TNDN (Biểu mẫu B02-DN)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kế toán trưởng đối soát tự động doanh thu, chi phí, lập dự toán thuế thu nhập doanh nghiệp trình Ban Giám Đốc.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Financial Metrics Sheet */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Bảng phân bổ chỉ tiêu tài chính</h4>
                
                <div className="divide-y divide-slate-100 text-xs text-slate-700">
                  <div className="flex justify-between py-2.5">
                    <span className="font-medium">1. Tổng Doanh Thu Bán Hàng (Gross Sales)</span>
                    <span className="font-mono font-semibold">{salesRevenueSum.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="font-medium text-slate-500">2. Thuế giá trị gia tăng đầu ra (Output VAT 10%)</span>
                    <span className="font-mono text-rose-500">-{salesVatOutput.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-slate-50 px-2 rounded font-bold">
                    <span className="text-slate-teal">3. Doanh Thu Thuần Hợp Lệ (Net Revenue)</span>
                    <span className="font-mono text-slate-teal">{netSalesRevenue.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="font-medium">4. Chi Phí Nhập Nguyên Vật Liệu (Material Costs)</span>
                    <span className="font-mono text-rose-600">-{materialCostSum.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="font-medium">5. Chi Phí Lương Nhân Viên Thực Trả (Wages &amp; Salaries)</span>
                    <span className="font-mono text-rose-600">-{totalEmployeeWagesSum.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="font-medium">6. Chi Phí Vận Hành Khác (Overhead - Rents, utilities)</span>
                    <span className="font-mono text-rose-600">-{otherOverheadCosts.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-slate-50 px-2 rounded font-bold text-rose-600">
                    <span>7. Tổng Chi Phí Hoạt Động (Total Expenses)</span>
                    <span className="font-mono">-{totalCorporateExpenses.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-slate-100 px-2 rounded font-black text-slate-800">
                    <span>8. Lợi Nhuận Trước Thuế (EBT)</span>
                    <span className="font-mono">{corporateProfitBeforeTax.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-2.5 text-amber-600 font-bold">
                    <span>9. Thuế Thu Nhập Doanh Nghiệp (CIT @ {corporateTaxRate}%)</span>
                    <span className="font-mono">-{corporateIncomeTax.toLocaleString()} đ</span>
                  </div>

                  <div className="flex justify-between py-3 bg-slate-teal text-white px-3 rounded-xl font-black text-sm">
                    <span>10. Lợi Nhuận Ròng Sau Thuế (Net Profit)</span>
                    <span className="font-mono">{netProfitAfterTax.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              {/* Explanatory notes & actions */}
              <div className="bg-slate-50 p-5 rounded-2xl flex flex-col justify-between border border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center">
                    <Info className="w-4 h-4 text-slate-teal mr-1.5" />
                    Thuyết Minh &amp; Căn Cứ Tính Thuế Doanh Nghiệp
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Báo cáo tài chính này phản ánh dữ liệu kết quả kinh doanh định kỳ của cơ sở sản xuất đồ gỗ mộc.
                  </p>
                  
                  <ul className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
                    <li>
                      <strong>Doanh thu tính thuế:</strong> Là doanh thu đã bóc tách thuế VAT đầu ra (10%) theo quy định hiện hành đối với hàng cơ khí mộc.
                    </li>
                    <li>
                      <strong>Chi phí sản xuất hợp lý:</strong> Bao gồm toàn bộ tiền thu mua gỗ nguyên khối, sơn, ốc vít có chứng từ hóa đơn đỏ, cộng với tổng quỹ lương nhân viên đã được ký duyệt quyết toán đối soát.
                    </li>
                    <li>
                      <strong>Thuế suất TNDN:</strong> Doanh nghiệp gỗ thuộc khối gia công chế biến chế tạo, chịu thuế suất phổ thông là {corporateTaxRate}%.
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Trạng thái hồ sơ thuế: <strong>Mới lập (Draft)</strong></span>
                  <button 
                    onClick={() => {
                      alert("Báo cáo tài chính đã được tải về máy của bạn thành công dưới dạng PDF mẫu.");
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải báo cáo CIT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PAYSLIP MODAL POPUP */}
      {selectedPayslipEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">PHIẾU LƯƠNG CHI TIẾT</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                  {selectedPayslipEmp.code} • {selectedPayslipEmp.position}
                </span>
              </div>
              <button 
                onClick={() => setSelectedPayslipEmp(null)}
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-800">{selectedPayslipEmp.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Tháng tính lương:</span>
                <span className="font-bold text-slate-800">Tháng 07 / 2026</span>
              </div>

              <div className="border-t border-dashed border-slate-100 pt-2.5 space-y-1.5">
                <div className="flex justify-between">
                  <span>Lương hợp đồng cơ bản:</span>
                  <span className="font-mono font-semibold">{selectedPayslipEmp.basic.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Lương khoán sản phẩm (Đã duyệt):</span>
                  <span className="font-mono font-bold">+{selectedPayslipEmp.pieceEarnings.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phụ cấp cơm trưa, xăng xe:</span>
                  <span className="font-mono">+{selectedPayslipEmp.allowances.toLocaleString()} đ</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-100 pt-2.5 space-y-1.5">
                <div className="flex justify-between text-rose-500">
                  <span>BHXH khấu trừ (10.5%):</span>
                  <span className="font-mono">-{selectedPayslipEmp.bhxh.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Thuế thu nhập cá nhân (PIT):</span>
                  <span className="font-mono">-{selectedPayslipEmp.pit.toLocaleString()} đ</span>
                </div>
              </div>

              {selectedPayslipEmp.pieceEarnings > 0 && (
                <div className="border-t border-slate-100 pt-2.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chi tiết công đoạn sản lượng đã làm:</h4>
                  <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {selectedPayslipEmp.tasks.map((t: any) => (
                      <div key={t.id} className="text-[9px] text-slate-500 flex justify-between">
                        <span className="truncate max-w-[200px]">{t.stageName}</span>
                        <span className="font-mono text-slate-700">x{t.quantity} = {t.totalWage.toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700">THỰC NHẬN CHUYỂN KHOẢN:</span>
                <span className="text-sm font-black font-mono text-slate-teal">{selectedPayslipEmp.netPay.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <button 
                onClick={() => {
                  alert("Đã gửi phiếu lương trực tuyến cho công nhân!");
                  setSelectedPayslipEmp(null);
                }}
                className="flex-1 bg-slate-teal hover:bg-slate-teal-dark text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Gửi Phiếu Lương Cho Thợ
              </button>
              <button 
                onClick={() => setSelectedPayslipEmp(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
