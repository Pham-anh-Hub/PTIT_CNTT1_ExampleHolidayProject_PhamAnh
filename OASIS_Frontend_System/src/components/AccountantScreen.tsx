import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, Receipt, DollarSign, RefreshCw, CheckSquare, 
  FileSpreadsheet, TrendingUp, UserCheck, Coins, ArrowUpRight, 
  Check, AlertCircle, Warehouse, Settings, Percent, Download, 
  ChevronRight, Users, CreditCard, Building, Info, Eye, ArrowLeft, Clock,
  Layers, Package, CheckCircle2, ShieldCheck, X, Plus, Filter, ArrowDownLeft, ChevronDown
} from "lucide-react";
import { Employee, Contract, SalesOrder, MaterialImport, FinishedProductImport, SupplierPayable } from "../types";
import WorkLogDetailPage from "./WorkLogDetailPage";
import { createExpenseApi, createReceiptApi, simulateBodNotificationApi, resolveProductionPayrollApi } from "../api";
import { ROUTES } from "../router/routeConfig";

interface AccountantScreenProps {
  initialTab?: "payroll_production" | "payroll_office" | "receipts_expenses" | "debts";
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

// --------------------------------------------------------------------------
// REUSABLE BUBBLE CONCEPT CUSTOM DROPDOWN (CLEAN RECTANGLE POPUP MENU)
// --------------------------------------------------------------------------
interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  className?: string;
  pillShape?: "full" | "2xl";
}

function CustomSelect({ value, options, onChange, icon, className = "", pillShape = "full" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerRounded = pillShape === "full" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="relative inline-block font-sans text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white border border-slate-200 ${triggerRounded} px-3.5 py-2 shadow-xs flex items-center justify-between text-xs font-bold text-slate-800 hover:border-blue-950/40 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap ${className}`}
      >
        <div className="flex items-center space-x-1.5 shrink-0">
          {icon}
          <span>{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-blue-950 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Popup Menu Card — Sleek Rounded Rectangle (rounded-xl) */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1 space-y-0.5 min-w-[170px] animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-950 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-blue-950"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Initial Mock Seed Office Payroll Data
const defaultOfficePayrolls = [
  { stt: 1, id: "off-1", employeeCode: "CTY001-OFF-001", name: "Nguyễn Văn A", department: "Kế toán", baseSalary: 15000000, allowance: 1000000, otHours: 10.5, otAmount: 1200000, lateCount: 2, latePenaltyAmount: 300000, lateNote: "Đi muộn 2 lần (30 phút)", bonus: 1000000, netSalary: 17900000, status: "PAID", period: "2026-07" },
  { stt: 2, id: "off-2", employeeCode: "CTY001-OFF-002", name: "Trần Thị B", department: "Kinh doanh", baseSalary: 12000000, allowance: 800000, otHours: 4.0, otAmount: 500000, lateCount: 0, latePenaltyAmount: 0, lateNote: "Đúng giờ", bonus: 1500000, netSalary: 14800000, status: "PENDING", period: "2026-07" },
  { stt: 3, id: "off-3", employeeCode: "CTY001-OFF-003", name: "Lê Hoàng C", department: "Nhân sự (HR)", baseSalary: 13500000, allowance: 900000, otHours: 0.0, otAmount: 0, lateCount: 1, latePenaltyAmount: 150000, lateNote: "Đi muộn 1 lần (15 phút)", bonus: 500000, netSalary: 14750000, status: "PENDING", period: "2026-07" }
];

// Initial Mock Seed Production Payroll Data (Piece-rate)
const defaultPieceRatePayrolls = [
  {
    stt: 1,
    id: "prod-piece-1",
    employeeId: "25",
    employeeCode: "CTY001-PROD-008",
    employeeName: "Trần Văn C",
    departmentName: "Phân xưởng Mộc",
    items: [
      { productType: "Bàn gỗ Sồi (Công đoạn Cắt)", quantity: 150, unitPrice: 30000, amount: 4500000 },
      { productType: "Ghế gỗ Sồi (Công đoạn Lắp ráp)", quantity: 80, unitPrice: 50000, amount: 4000000 },
      { productType: "Tủ áo 3 cánh (Công đoạn Sơn PU)", quantity: 20, unitPrice: 150000, amount: 3000000 }
    ],
    totalQuantity: 250,
    totalAmount: 11500000,
    status: "PENDING",
    period: "2026-07"
  },
  {
    stt: 2,
    id: "prod-piece-2",
    employeeId: "26",
    employeeCode: "CTY001-PROD-012",
    employeeName: "Nguyễn Công Binh",
    departmentName: "Phân xưởng Cơ khí",
    items: [
      { productType: "Khung bàn sắt (Công đoạn Hàn)", quantity: 60, unitPrice: 80000, amount: 4800000 },
      { productType: "Hộc kéo kim loại (Lắp đặt)", quantity: 40, unitPrice: 60000, amount: 2400000 }
    ],
    totalQuantity: 100,
    totalAmount: 7200000,
    status: "PAID",
    period: "2026-07"
  }
];

// Initial Mock Seed Hourly Rate Payroll Data
const defaultHourlyPayrolls = [
  { stt: 1, id: "prod-hour-1", employeeId: "101", employeeCode: "CTY001-WRK-005", employeeName: "Phạm Văn Dóng", departmentName: "Phân xưởng Sơn", totalHours: 184.0, workDays: 23, hourlyRate: 45000, totalAmount: 8280000, status: "PENDING", period: "2026-07" },
  { stt: 2, id: "prod-hour-2", employeeId: "102", employeeCode: "CTY001-WRK-009", employeeName: "Hoàng Tấn Phát", departmentName: "Phân xưởng Cơ khí", totalHours: 200.0, workDays: 25, hourlyRate: 50000, totalAmount: 10000000, status: "PAID", period: "2026-07" }
];

// Initial Mock Seed Vouchers List - Structured across periods
const defaultVouchersList = [
  // --- Tháng 07/2026 (Kỳ hiện tại) ---
  {
    id: "v-9",
    voucherCode: "RV-2026-004",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền cọc đợt 1 (30%)",
    partnerName: "Khách hàng Biệt thự V",
    amount: 180000000,
    createdDate: "2026-07-05",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu tạm ứng cọc đợt 1 hợp đồng thi công biệt thự DH-2026-12",
    status: "COMPLETED"
  },
  {
    id: "v-10",
    voucherCode: "RV-2026-005",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền dịch vụ / Chi phí khác",
    partnerName: "Công ty TNHH Thiết kế X",
    amount: 35000000,
    createdDate: "2026-07-10",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu tiền phí bảo trì hệ thống nội thất xưởng",
    status: "COMPLETED"
  },
  {
    id: "v-11",
    voucherCode: "EV-2026-006",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi mua nguyên vật liệu sản xuất",
    partnerName: "Nhà cung cấp Sơn PU Hà Thành",
    amount: 45000000,
    createdDate: "2026-07-15",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thanh toán đợt 1 tiền mua sơn phủ công nghiệp PU",
    status: "COMPLETED"
  },
  {
    id: "v-14",
    voucherCode: "EV-2026-007",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi giải ngân lương",
    partnerName: "Trần Văn C (CTY001-PROD-008)",
    amount: 11500000,
    createdDate: "2026-07-21",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Giải ngân quỹ lương kỳ 2026-07 - Duyệt chi thành công",
    status: "COMPLETED"
  },
  // --- Tháng 06/2026 ---
  {
    id: "v-1",
    voucherCode: "RV-2026-001",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền cọc đợt 1 (30%)",
    partnerName: "Công ty Cổ phần Nội thất A",
    amount: 150000000,
    createdDate: "2026-06-10",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu tạm ứng cọc đợt 1 đơn hàng thi công nội thất DH-2026-08",
    status: "COMPLETED"
  },
  {
    id: "v-2",
    voucherCode: "RV-2026-002",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền tiến độ đợt 2 (40%)",
    partnerName: "Tập đoàn Đầu tư & Xây dựng B",
    amount: 280000000,
    createdDate: "2026-06-12",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu thanh toán tiến độ đợt 2 dự án cao ốc DH-2026-05",
    status: "COMPLETED"
  },
  {
    id: "v-3",
    voucherCode: "RV-2026-003",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền bán phế liệu / Phế phẩm xưởng",
    partnerName: "Công ty Phế liệu Minh Đức",
    amount: 20000000,
    createdDate: "2026-06-14",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu thanh lý mùn cưa và phôi gỗ thừa xưởng mộc",
    status: "COMPLETED"
  },
  {
    id: "v-4",
    voucherCode: "EV-2026-001",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi giải ngân lương",
    partnerName: "Nguyễn Văn A (CTY001-OFF-001)",
    amount: 17900000,
    createdDate: "2026-06-16",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Chi trả quỹ lương khối văn phòng tháng 06/2026",
    status: "COMPLETED"
  },
  {
    id: "v-5",
    voucherCode: "EV-2026-002",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi giải ngân lương",
    partnerName: "Nguyễn Công Binh (CTY001-PROD-012)",
    amount: 7200000,
    createdDate: "2026-06-16",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Chi trả lương sản phẩm phân xưởng cơ khí tháng 06/2026",
    status: "COMPLETED"
  },
  {
    id: "v-6",
    voucherCode: "EV-2026-003",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi giải ngân lương",
    partnerName: "Hoàng Tấn Phát (CTY001-WRK-009)",
    amount: 10000000,
    createdDate: "2026-06-16",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Chi trả lương công ngày phân xưởng cơ khí tháng 06/2026",
    status: "COMPLETED"
  },
  {
    id: "v-7",
    voucherCode: "EV-2026-004",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi mua nguyên vật liệu sản xuất",
    partnerName: "Nhà cung cấp Gỗ Sồi An Cường",
    amount: 215000000,
    createdDate: "2026-06-18",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thanh toán đợt 1 tiền nhập gỗ sồi tấm chất lượng cao",
    status: "COMPLETED"
  },
  {
    id: "v-8",
    voucherCode: "EV-2026-005",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi phí vận hành / Quản lý xưởng",
    partnerName: "Công ty Điện lực & Điện nước HN",
    amount: 30000000,
    createdDate: "2026-06-20",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Chi phí điện 3 pha thế hệ mới và nước sản xuất xưởng",
    status: "COMPLETED"
  },
  // --- Tháng 05/2026 ---
  {
    id: "v-12",
    voucherCode: "RV-2026-000",
    voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
    category: "Thu tiền quyết toán đợt 3 (30%)",
    partnerName: "Tập đoàn Phát triển Bất động sản Y",
    amount: 220000000,
    createdDate: "2026-05-20",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Thu tiền quyết toán nghiệm thu dự án tháng 5",
    status: "COMPLETED"
  },
  {
    id: "v-13",
    voucherCode: "EV-2026-000",
    voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
    category: "Chi giải ngân lương",
    partnerName: "Quỹ lương tổng tháng 05/2026",
    amount: 150000000,
    createdDate: "2026-05-28",
    createdBy: "Nguyễn Thị B (Kế toán)",
    note: "Chi giải ngân lương cố định tháng 05/2026",
    status: "COMPLETED"
  }
];

export default function AccountantScreen({
  initialTab = "payroll_production",
  employees,
  contracts,
  orders,
  materialImports,
  finishedImports,
  supplierPayables,
  onUpdateSupplierPayable,
  corporateTaxRate,
  onUpdateTaxRate,
  onSyncDataToBOD,
  onPublishPayslips
}: AccountantScreenProps) {
  const navigate = useNavigate();

  // Main Active Tab synchronized with route via initialTab
  const [activeTab, setActiveTab] = useState<"payroll_production" | "payroll_office" | "receipts_expenses" | "debts">(
    initialTab
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: "payroll_production" | "payroll_office" | "receipts_expenses" | "debts") => {
    setActiveTab(tab);
    if (tab === "payroll_production") navigate(ROUTES.ACCOUNTANT_PRODUCTION_PAYROLL);
    else if (tab === "payroll_office") navigate(ROUTES.ACCOUNTANT_OFFICE_PAYROLL);
    else if (tab === "receipts_expenses") navigate(ROUTES.ACCOUNTANT_VOUCHERS);
    else if (tab === "debts") navigate(ROUTES.ACCOUNTANT_DEBTS);
  };

  // Production Payroll Sub-tab
  const [prodSubTab, setProdSubTab] = useState<"piece_rate" | "hourly_rate">("piece_rate");

  // Selected Detail View
  const [activeDetailView, setActiveDetailView] = useState<{
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    departmentName: string;
    type: "piece_rate" | "hourly";
  } | null>(null);

  // Period filter — Default to Current Month: Tháng 07, 2026
  const [selectedPeriod, setSelectedPeriod] = useState("2026-07");

  // Options list for period selector (Clean Labels)
  const periodOptions = [
    { value: "2026-07", label: "Tháng 07, 2026" },
    { value: "2026-06", label: "Tháng 06, 2026" },
    { value: "2026-05", label: "Tháng 05, 2026" }
  ];

  // Options list for Receipt Categories
  const receiptCategoryOptions = [
    { value: "Thu tiền cọc đợt 1 (30%)", label: "Thu tiền cọc đợt 1 (30%)" },
    { value: "Thu tiền tiến độ đợt 2 (40%)", label: "Thu tiền tiến độ đợt 2 (40%)" },
    { value: "Thu tiền quyết toán đợt 3 (30%)", label: "Thu tiền quyết toán đợt 3 (30%)" },
    { value: "Thu tiền bán phế liệu / Phế phẩm xưởng", label: "Thu tiền bán phế liệu / Phế phẩm xưởng" },
    { value: "Thu tiền hoàn ứng / Phạt vi phạm hợp đồng", label: "Thu tiền hoàn ứng / Phạt vi phạm hợp đồng" },
    { value: "CUSTOM", label: "+ Nhập hạng mục thu khác..." }
  ];

  // Options list for Expense Categories
  const expenseCategoryOptions = [
    { value: "Chi mua nguyên vật liệu sản xuất", label: "Chi mua nguyên vật liệu sản xuất" },
    { value: "Chi giải ngân quỹ lương", label: "Chi giải ngân quỹ lương" },
    { value: "Chi phí vận hành / Quản lý xưởng", label: "Chi phí vận hành / Quản lý xưởng" },
    { value: "Chi phí máy móc & bảo dưỡng", label: "Chi phí máy móc & bảo dưỡng" },
    { value: "CUSTOM", label: "+ Nhập hạng mục chi khác..." }
  ];

  // Office payroll adjustment modal state
  const [editingOfficeEmp, setEditingOfficeEmp] = useState<any | null>(null);

  // Disbursement Confirmation Modal state
  const [confirmingDisbursement, setConfirmingDisbursement] = useState<{
    id: string;
    name: string;
    code: string;
    amount: number;
    type: "office" | "piece" | "hourly";
  } | null>(null);

  // State Lập phiếu thu / Phiếu chi mới thủ công
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false);
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(false);

  // Form states cho Phiếu Thu Mới
  const [receiptPartner, setReceiptPartner] = useState("");
  const [receiptCategorySelect, setReceiptCategorySelect] = useState("Thu tiền cọc đợt 1 (30%)");
  const [customReceiptCategory, setCustomReceiptCategory] = useState("");
  const [receiptAmount, setReceiptAmount] = useState<number>(10000000);
  const [receiptNote, setReceiptNote] = useState("");

  // Form states cho Phiếu Chi Mới
  const [expensePartner, setExpensePartner] = useState("");
  const [expenseCategorySelect, setExpenseCategorySelect] = useState("Chi mua nguyên vật liệu sản xuất");
  const [customExpenseCategory, setCustomExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number>(5000000);
  const [expenseNote, setExpenseNote] = useState("");

  // Filter phiếu thu/chi
  const [voucherFilter, setVoucherFilter] = useState<"ALL" | "RECEIPT" | "EXPENSE">("ALL");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Persistent States with Versioned localStorage Fallback
  const [officePayrolls, setOfficePayrolls] = useState(() => {
    const saved = localStorage.getItem("oasis_office_payrolls_v6");
    return saved ? JSON.parse(saved) : defaultOfficePayrolls;
  });

  const [pieceRatePayrolls, setPieceRatePayrolls] = useState(() => {
    const saved = localStorage.getItem("oasis_piece_payrolls_v6");
    return saved ? JSON.parse(saved) : defaultPieceRatePayrolls;
  });

  const [hourlyPayrolls, setHourlyPayrolls] = useState(() => {
    const saved = localStorage.getItem("oasis_hourly_payrolls_v6");
    return saved ? JSON.parse(saved) : defaultHourlyPayrolls;
  });

  const [vouchersList, setVouchersList] = useState(() => {
    const saved = localStorage.getItem("oasis_vouchers_list_v6");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultVouchersList;
  });

  // Sync states to versioned localStorage whenever updated
  useEffect(() => {
    localStorage.setItem("oasis_office_payrolls_v6", JSON.stringify(officePayrolls));
  }, [officePayrolls]);

  useEffect(() => {
    localStorage.setItem("oasis_piece_payrolls_v6", JSON.stringify(pieceRatePayrolls));
  }, [pieceRatePayrolls]);

  useEffect(() => {
    localStorage.setItem("oasis_hourly_payrolls_v6", JSON.stringify(hourlyPayrolls));
  }, [hourlyPayrolls]);

  useEffect(() => {
    localStorage.setItem("oasis_vouchers_list_v6", JSON.stringify(vouchersList));
  }, [vouchersList]);

  // --------------------------------------------------------------------------
  // STRICT PERIOD-BASED DYNAMIC CALCULATIONS FOR FINANCIAL KPI CARDS
  // --------------------------------------------------------------------------
  // Lọc danh sách Phiếu Thu/Chi theo đúng Kỳ Thời Gian chọn (selectedPeriod: YYYY-MM)
  const periodVouchers = vouchersList.filter((v: any) => v.createdDate && v.createdDate.startsWith(selectedPeriod));

  // 1. Tổng doanh thu = Sum Phiếu Thu thuộc selectedPeriod
  const totalRevenue = periodVouchers
    .filter((v: any) => v.voucherType === "RECEIPT")
    .reduce((sum: number, v: any) => sum + (Number(v.amount) || 0), 0);

  // 2. Tổng chi phí = Sum Phiếu Chi thuộc selectedPeriod
  const totalExpenses = periodVouchers
    .filter((v: any) => v.voucherType === "EXPENSE")
    .reduce((sum: number, v: any) => sum + (Number(v.amount) || 0), 0);

  // 3. Thuế TNDN Dự Tính (20%)
  const estimatedTax = Math.max(0, Math.round((totalRevenue - totalExpenses) * (corporateTaxRate / 100)));

  // 4. Lợi nhuận ròng thực giữ
  const netProfit = (totalRevenue - totalExpenses) - estimatedTax;

  // Lọc danh sách phiếu thu/chi hiển thị trong bảng theo kỳ selectedPeriod & bộ lọc loại phiếu
  const filteredVouchers = vouchersList.filter((v: any) => {
    const matchesPeriod = v.createdDate && v.createdDate.startsWith(selectedPeriod);
    const matchesType = voucherFilter === "ALL" || v.voucherType === voucherFilter;
    return matchesPeriod && matchesType;
  });

  // Handlers
  const handleSyncToBOD = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    
    // Gửi thông báo đồng bộ số liệu tài chính lên Ban Giám Đốc (BOD)
    try {
      await simulateBodNotificationApi({
        title: "Đồng bộ số liệu Kế toán & Tài chính",
        message: `Bộ phận Kế toán vừa đồng bộ số liệu tài chính kỳ ${selectedPeriod}: Doanh thu ${totalRevenue.toLocaleString("vi-VN")}đ, Chi phí ${totalExpenses.toLocaleString("vi-VN")}đ, Lợi nhuận ròng ${netProfit.toLocaleString("vi-VN")}đ.`,
        type: "FINANCE_SYNC",
        targetRole: "BOD"
      });
    } catch (err) {
      console.warn("Mô phỏng thông báo BOD offline:", err);
    }

    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      if (onSyncDataToBOD) onSyncDataToBOD();
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1200);
  };

  // EXECUTE DISBURSEMENT: Duyệt Chi & Tự động lưu vĩnh viễn + Cập nhật 4 thẻ KPI theo kỳ + Gửi thông báo real-time tới BOD
  const executeDisbursement = async () => {
    if (!confirmingDisbursement) return;
    const { id, name, code, amount, type } = confirmingDisbursement;

    // 1. Cập nhật Trạng thái Bảng lương
    if (type === "piece") {
      setPieceRatePayrolls((prev: any[]) => prev.map(item => item.id === id ? { ...item, status: "PAID" } : item));
    } else if (type === "hourly") {
      setHourlyPayrolls((prev: any[]) => prev.map(item => item.id === id ? { ...item, status: "PAID" } : item));
    } else if (type === "office") {
      setOfficePayrolls((prev: any[]) => prev.map(item => item.id === id ? { ...item, status: "PAID" } : item));
    }

    // 2. Tự động sinh mã Phiếu Chi
    const nextCodeIndex = vouchersList.filter((v: any) => v.voucherType === "EXPENSE").length + 1;
    const newVoucherCode = `EV-2026-${String(nextCodeIndex).padStart(3, "0")}`;
    const issueDate = `${selectedPeriod}-21`;

    const newVoucher = {
      id: `v-${Date.now()}`,
      voucherCode: newVoucherCode,
      voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
      category: "Chi giải ngân lương",
      partnerName: `${name} (${code})`,
      amount: amount,
      createdDate: issueDate,
      createdBy: "Nguyễn Thị B (Kế toán)",
      note: `Giải ngân quỹ lương kỳ ${selectedPeriod} - Duyệt chi thành công`,
      status: "COMPLETED"
    };

    setVouchersList((prev: any[]) => [newVoucher, ...prev]);

    // 3. Gửi REST API tới Backend Spring Boot DB
    try {
      if (type === "piece" || type === "hourly") {
        const cleanEmpId = id.replace("prod-piece-", "").replace("prod-hour-", "");
        await resolveProductionPayrollApi(cleanEmpId, selectedPeriod);
      }
      await createExpenseApi({
        category: "PAYROLL",
        recipientName: `${name} (${code})`,
        amount: amount,
        paymentMethod: "BANK_TRANSFER",
        note: `Giải ngân quỹ lương kỳ ${selectedPeriod} cho ${name}`
      });
    } catch (e) {
      console.warn("Đã lưu duyệt chi vào bộ nhớ local:", e);
    }

    // 4. Gửi thông báo Real-time lên Hộp thư Ban Giám Đốc (BOD)
    try {
      await simulateBodNotificationApi({
        title: "Duyệt chi giải ngân lương thành công",
        message: `Kế toán đã duyệt chi thành công số tiền ${amount.toLocaleString("vi-VN")}đ cho nhân sự ${name} (${code}) kỳ ${selectedPeriod}.`,
        type: "PAYROLL_DISBURSEMENT",
        targetRole: "BOD"
      });
    } catch (err) {
      console.warn("Thông báo BOD offline:", err);
    }

    setConfirmingDisbursement(null);
  };

  // Tạo mới Phiếu Thu thủ công & Tự động tăng Doanh thu/Lợi nhuận ròng đúng kỳ
  const handleCreateReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptPartner.trim() || receiptAmount <= 0) return;

    const finalCategory = receiptCategorySelect === "CUSTOM" 
      ? (customReceiptCategory.trim() || "Thu tiền dịch vụ phát sinh khác")
      : receiptCategorySelect;

    const nextCodeIndex = vouchersList.filter((v: any) => v.voucherType === "RECEIPT").length + 1;
    const issueDate = `${selectedPeriod}-15`;

    const newVoucher = {
      id: `v-${Date.now()}`,
      voucherCode: `RV-2026-${String(nextCodeIndex).padStart(3, "0")}`,
      voucherType: "RECEIPT" as "RECEIPT" | "EXPENSE",
      category: finalCategory,
      partnerName: receiptPartner.trim(),
      amount: receiptAmount,
      createdDate: issueDate,
      createdBy: "Nguyễn Thị B (Kế toán)",
      note: receiptNote.trim() || "Lập phiếu thu đợt tiền mặt/chuyển khoản",
      status: "COMPLETED"
    };

    setVouchersList((prev: any[]) => [newVoucher, ...prev]);
    setShowCreateReceiptModal(false);

    // Gửi REST API tới Backend DB
    try {
      await createReceiptApi({
        amount: receiptAmount,
        paymentMethod: "BANK_TRANSFER",
        note: `${finalCategory} từ đối tác ${receiptPartner.trim()}`
      });
    } catch (err) {
      console.warn("Lưu phiếu thu local:", err);
    }

    setReceiptPartner("");
    setReceiptNote("");
    setCustomReceiptCategory("");
  };

  // Tạo mới Phiếu Chi thủ công & Tự động tăng Tổng chi phí/Giảm Lợi nhuận ròng đúng kỳ
  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expensePartner.trim() || expenseAmount <= 0) return;

    const finalCategory = expenseCategorySelect === "CUSTOM"
      ? (customExpenseCategory.trim() || "Chi phí phát sinh xưởng sản xuất")
      : expenseCategorySelect;

    const nextCodeIndex = vouchersList.filter((v: any) => v.voucherType === "EXPENSE").length + 1;
    const issueDate = `${selectedPeriod}-18`;

    const newVoucher = {
      id: `v-${Date.now()}`,
      voucherCode: `EV-2026-${String(nextCodeIndex).padStart(3, "0")}`,
      voucherType: "EXPENSE" as "RECEIPT" | "EXPENSE",
      category: finalCategory,
      partnerName: expensePartner.trim(),
      amount: expenseAmount,
      createdDate: issueDate,
      createdBy: "Nguyễn Thị B (Kế toán)",
      note: expenseNote.trim() || "Lập phiếu chi tiền mặt/chuyển khoản",
      status: "COMPLETED"
    };

    setVouchersList((prev: any[]) => [newVoucher, ...prev]);
    setShowCreateExpenseModal(false);

    // Gửi REST API tới Backend DB
    try {
      await createExpenseApi({
        category: "OPERATIONAL",
        recipientName: expensePartner.trim(),
        amount: expenseAmount,
        paymentMethod: "BANK_TRANSFER",
        note: expenseNote.trim() || finalCategory
      });
    } catch (err) {
      console.warn("Lưu phiếu chi local:", err);
    }

    setExpensePartner("");
    setExpenseNote("");
    setCustomExpenseCategory("");
  };

  // If a detail view is active, render WorkLogDetailPage directly
  if (activeDetailView) {
    return (
      <WorkLogDetailPage
        employeeId={activeDetailView.employeeId}
        employeeName={activeDetailView.employeeName}
        employeeCode={activeDetailView.employeeCode}
        departmentName={activeDetailView.departmentName}
        period={selectedPeriod}
        type={activeDetailView.type}
        onBack={() => setActiveDetailView(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" id="accountant-main-view">
      
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight flex items-center">
            <Calculator className="w-6 h-6 text-blue-950 mr-2.5" />
            Phân Hệ Tài Chính - Kế Toán Doanh Nghiệp
          </h1>
          <p className="text-xs text-slate-500 font-poppins mt-1">
            Quản lý bảng tính lương khối văn phòng, lương sản xuất phân rã theo loại hàng, theo dõi dòng tiền thu/chi và đối soát công nợ.
          </p>
        </div>

        {/* Header Controls: Time Select + Sync to BOD in SAME ROW */}
        <div className="flex items-center space-x-2.5 whitespace-nowrap">
          
          {/* Custom Select for Period Filter (Compact Pill) */}
          <CustomSelect
            value={selectedPeriod}
            options={periodOptions}
            onChange={setSelectedPeriod}
            icon={<Clock className="w-3.5 h-3.5 text-blue-950 shrink-0" />}
            pillShape="full"
          />

          {/* Sync Button on the EXACT SAME ROW */}
          <button
            onClick={handleSyncToBOD}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-full text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer ${syncSuccess
              ? "bg-blue-600 text-white"
              : "bg-blue-950 hover:bg-blue-900 active:scale-95 text-white"
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Đang đồng bộ..." : syncSuccess ? "Đã đồng bộ lên BOD ✓" : "Đồng bộ số liệu lên BOD"}</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC PERIOD-FILTERED FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tổng Doanh Thu Thuần */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs transition-all hover:border-blue-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu Thuần</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-950">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-slate-900 mt-2">
            {totalRevenue.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[10px] text-blue-950 font-medium block mt-1">
            Kỳ {selectedPeriod}: {periodVouchers.filter((v: any) => v.voucherType === "RECEIPT").length} Phiếu Thu phát sinh
          </span>
        </div>

        {/* Card 2: Tổng Chi Phí Thực Tế */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs transition-all hover:border-rose-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Chi Phí Thực Tế</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-500">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-rose-600 mt-2">
            {totalExpenses.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[10px] text-rose-600 font-medium block mt-1">
            Kỳ {selectedPeriod}: {periodVouchers.filter((v: any) => v.voucherType === "EXPENSE").length} Phiếu Chi &amp; Giải ngân
          </span>
        </div>

        {/* Card 3: Thuế TNDN Dự Tính (20%) */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs transition-all hover:border-amber-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thuế TNDN Dự Tính ({corporateTaxRate}%)</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-500">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-amber-600 mt-2">
            {estimatedTax.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[10px] text-amber-700 font-medium block mt-1">
            = (Doanh thu - Chi phí kỳ {selectedPeriod}) × {corporateTaxRate}%
          </span>
        </div>

        {/* Card 4: Lợi Nhuận Ròng Thực Giữ */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs transition-all hover:border-emerald-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Nhuận Ròng Thực Giữ</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-950">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className={`text-lg font-bold font-mono mt-2 ${netProfit >= 0 ? "text-blue-950" : "text-rose-600"}`}>
            {netProfit.toLocaleString("vi-VN")} đ
          </p>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            Thặng dư ròng giữ lại kỳ {selectedPeriod}
          </span>
        </div>

      </div>

      {/* 3. Main Navigation Menu (Synchronized with Sidebar URL Navigation) */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-500 gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
        <button
          onClick={() => handleTabChange("payroll_production")}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "payroll_production" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-blue-950 hover:bg-white/60"
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lương Sản Xuất ({pieceRatePayrolls.length + hourlyPayrolls.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("payroll_office")}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "payroll_office" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-blue-950 hover:bg-white/60"
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Lương Văn Phòng ({officePayrolls.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("receipts_expenses")}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "receipts_expenses" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-blue-950 hover:bg-white/60"
            }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Thu - Chi &amp; Dòng Tiền ({filteredVouchers.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("debts")}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === "debts" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-blue-950 hover:bg-white/60"
            }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Công Nợ Đợt</span>
        </button>
      </div>

      {/* 4. MAIN TAB CONTENT VIEWS */}

      {/* TAB 1: LƯƠNG SẢN XUẤT */}
      {activeTab === "payroll_production" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub-tab Switcher Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl">
              <button
                onClick={() => setProdSubTab("piece_rate")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${prodSubTab === "piece_rate" ? "bg-blue-950 text-white shadow-xs" : "text-slate-600 hover:text-blue-950 font-medium"
                  }`}
              >
                Sub-Tab 1: Lương Sản Phẩm (Piece-rate)
              </button>

              <button
                onClick={() => setProdSubTab("hourly_rate")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${prodSubTab === "hourly_rate" ? "bg-blue-950 text-white shadow-xs" : "text-slate-600 hover:text-blue-950 font-medium"
                  }`}
              >
                Sub-Tab 2: Lương Công Ngày (Hourly-rate)
              </button>
            </div>

            <span className="text-xs text-slate-500 font-poppins pr-2">
              Kỳ lương lọc: <strong className="font-mono font-bold text-slate-900">{selectedPeriod}</strong>
            </span>
          </div>

          {/* SUB-TAB 1: LƯƠNG SẢN PHẨM PHÂN RÃ THEO LOẠI HÀNG */}
          {prodSubTab === "piece_rate" && (
            <div className="space-y-4">
              {pieceRatePayrolls.map((payroll: any) => (
                <div key={payroll.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-200 transition-all">
                  
                  {/* Payroll Worker Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-full bg-blue-950 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {payroll.stt}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          {payroll.employeeName} <span className="text-[11px] font-mono font-normal text-slate-500">({payroll.employeeCode})</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">{payroll.departmentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {payroll.status === "PAID" ? (
                        <span className="bg-blue-50 text-blue-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center space-x-1 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-950 mr-1" />
                          <span>Đã giải quyết ✓</span>
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                          Chưa giải quyết
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itemized Table Breakdown */}
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-100">
                          <th className="py-2.5 px-3">Loại Hàng / Sản Phẩm Gia Công</th>
                          <th className="py-2.5 px-3 text-right">Số Lượng</th>
                          <th className="py-2.5 px-3 text-right">Đơn Giá Công Đoạn</th>
                          <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {payroll.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{item.productType}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">{item.unitPrice.toLocaleString("vi-VN")}đ</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{item.amount.toLocaleString("vi-VN")}đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-100 text-xs">
                          <td className="py-2.5 px-3 text-slate-900 font-bold">TỔNG CỘNG THÀNH TIỀN SẢN LƯỢNG</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">{payroll.totalQuantity} sp</td>
                          <td className="py-2.5 px-3"></td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950 text-sm">{payroll.totalAmount.toLocaleString("vi-VN")} VNĐ</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between pt-1 gap-3">
                    <button
                      onClick={() => setActiveDetailView({
                        employeeId: payroll.employeeId,
                        employeeName: payroll.employeeName,
                        employeeCode: payroll.employeeCode,
                        departmentName: payroll.departmentName,
                        type: "piece_rate"
                      })}
                      className="bg-white hover:bg-blue-50 text-blue-950 border border-slate-200 hover:border-blue-300 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-950" />
                      <span>Xem chi tiết nhật ký công từng ngày</span>
                    </button>

                    {payroll.status === "PENDING" && (
                      <button
                        onClick={() => setConfirmingDisbursement({
                          id: payroll.id,
                          name: payroll.employeeName,
                          code: payroll.employeeCode,
                          amount: payroll.totalAmount,
                          type: "piece"
                        })}
                        className="bg-blue-950 hover:bg-blue-900 active:scale-95 text-white text-[11px] font-bold px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Duyệt Chi Giải Ngân</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUB-TAB 2: LƯƠNG NHÂN VIÊN LÀM THEO CÔNG NGÀY */}
          {prodSubTab === "hourly_rate" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Bảng Tính Lương Nhân Viên Làm Theo Công / Giờ Ngày (Kỳ: {selectedPeriod})
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-600">
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Mã NV / Họ Tên</th>
                      <th className="py-2.5 px-3">Phân Xưởng</th>
                      <th className="py-2.5 px-3 text-right">Tổng Giờ Làm (Công)</th>
                      <th className="py-2.5 px-3 text-right">Đơn Giá / Giờ</th>
                      <th className="py-2.5 px-3 text-right">Thành Tiền Tích Lũy</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {hourlyPayrolls.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.stt}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{item.employeeName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{item.employeeCode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">{item.departmentName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.totalHours} giờ <span className="text-[11px] text-slate-500 font-normal">({item.workDays} công)</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">{item.hourlyRate.toLocaleString("vi-VN")}đ/h</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950 whitespace-nowrap">{item.totalAmount.toLocaleString("vi-VN")}đ</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {item.status === "PAID" ? (
                            <span className="bg-blue-50 text-blue-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center whitespace-nowrap">
                              Đã giải quyết ✓
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center whitespace-nowrap">
                              Chưa giải quyết
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setActiveDetailView({
                                employeeId: item.employeeId,
                                employeeName: item.employeeName,
                                employeeCode: item.employeeCode,
                                departmentName: item.departmentName,
                                type: "hourly"
                              })}
                              className="bg-white hover:bg-blue-50 text-blue-950 border border-slate-200 hover:border-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                            >
                              Xem Chi Tiết
                            </button>
                            {item.status === "PENDING" && (
                              <button
                                onClick={() => setConfirmingDisbursement({
                                  id: item.id,
                                  name: item.employeeName,
                                  code: item.employeeCode,
                                  amount: item.totalAmount,
                                  type: "hourly"
                                })}
                                className="bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
                              >
                                Duyệt Chi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: LƯƠNG KHỐI VĂN PHÒNG */}
      {activeTab === "payroll_office" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Bảng Tính Lương Khối Văn Phòng (Lương Cứng + OT - Phạt Đi Muộn)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Áp dụng cho nhân viên hành chính văn phòng có lương cố định kỳ {selectedPeriod}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã NV / Họ Tên</th>
                  <th className="py-2.5 px-3 text-right">Lương Cứng</th>
                  <th className="py-2.5 px-3 text-right">Tiền Làm Thêm (OT)</th>
                  <th className="py-2.5 px-3 text-right">Phạt Đi Muộn</th>
                  <th className="py-2.5 px-3 text-right">Lương Thực Lĩnh</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {officePayrolls.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{emp.stt}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{emp.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{emp.employeeCode} • {emp.department}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">{emp.baseSalary.toLocaleString("vi-VN")}đ</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-950 font-bold whitespace-nowrap">
                      +{emp.otAmount.toLocaleString("vi-VN")}đ <span className="text-[10px] text-slate-500 font-normal block">({emp.otHours}h)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-500 font-bold whitespace-nowrap">
                      -{emp.latePenaltyAmount.toLocaleString("vi-VN")}đ <span className="text-[10px] text-slate-500 font-normal block">({emp.lateNote})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{emp.netSalary.toLocaleString("vi-VN")}đ</td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {emp.status === "PAID" ? (
                        <span className="bg-blue-50 text-blue-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center whitespace-nowrap">
                          Đã giải quyết ✓
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center whitespace-nowrap">
                          Chưa giải quyết
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => setEditingOfficeEmp(emp)}
                          className="bg-white hover:bg-blue-50 text-blue-950 border border-slate-200 hover:border-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                        >
                          Hiệu chỉnh Note
                        </button>
                        {emp.status === "PENDING" && (
                          <button
                            onClick={() => setConfirmingDisbursement({
                              id: emp.id,
                              name: emp.name,
                              code: emp.employeeCode,
                              amount: emp.netSalary,
                              type: "office"
                            })}
                            className="bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
                          >
                            Duyệt Chi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: THU - CHI & DÒNG TIỀN (FILTERED ACCORDING TO SELECTED PERIOD) */}
      {activeTab === "receipts_expenses" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-5 animate-in fade-in duration-200">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Receipt className="w-4.5 h-4.5 text-blue-950 mr-2" />
                Lịch Sử Phiếu Thu Đợt &amp; Phiếu Chi Tiền kỳ {selectedPeriod} ({filteredVouchers.length} chứng từ)
              </h3>
              <p className="text-xs text-slate-500 font-poppins mt-0.5">
                Theo dõi nhật ký thu tiền cọc đơn hàng và các khoản chi giải ngân thực tế lọc đúng theo tháng {selectedPeriod}.
              </p>
            </div>

            {/* White-Blue Tone Buttons for Receipts & Expenses */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCreateReceiptModal(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-blue-950" />
                <span>Lập Phiếu Thu Mới</span>
              </button>

              <button
                onClick={() => setShowCreateExpenseModal(true)}
                className="bg-blue-950 hover:bg-blue-900 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Lập Phiếu Chi Mới</span>
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-full w-fit border border-slate-200/60">
            <button
              onClick={() => setVoucherFilter("ALL")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${voucherFilter === "ALL" ? "bg-blue-950 text-white shadow-xs" : "text-slate-600 hover:text-blue-950"
                }`}
            >
              Tất cả ({periodVouchers.length})
            </button>
            <button
              onClick={() => setVoucherFilter("RECEIPT")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${voucherFilter === "RECEIPT" ? "bg-blue-950 text-white shadow-xs" : "text-slate-600 hover:text-blue-950"
                }`}
            >
              Phiếu Thu ({periodVouchers.filter((v: any) => v.voucherType === "RECEIPT").length})
            </button>
            <button
              onClick={() => setVoucherFilter("EXPENSE")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${voucherFilter === "EXPENSE" ? "bg-blue-950 text-white shadow-xs" : "text-slate-600 hover:text-blue-950"
                }`}
            >
              Phiếu Chi ({periodVouchers.filter((v: any) => v.voucherType === "EXPENSE").length})
            </button>
          </div>

          {/* Vouchers Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-3 px-4">Mã Chứng Từ</th>
                  <th className="py-3 px-4">Loại Phiếu</th>
                  <th className="py-3 px-4">Đối Tác / Người Nhận</th>
                  <th className="py-3 px-4">Hạng Mục</th>
                  <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                  <th className="py-3 px-4">Ngày Lập</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredVouchers.length > 0 ? (
                  filteredVouchers.map((voucher: any) => (
                    <tr key={voucher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {voucher.voucherCode}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {voucher.voucherType === "RECEIPT" ? (
                          <span className="bg-blue-50 text-blue-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-950 mr-1" />
                            Phiếu Thu (Inflow)
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 inline-flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 mr-1" />
                            Phiếu Chi (Outflow)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {voucher.partnerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold block">{voucher.category}</span>
                        <span className="text-[10px] text-slate-400 font-poppins">{voucher.note}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {voucher.voucherType === "RECEIPT" ? (
                          <span className="text-blue-950 text-sm">+{voucher.amount.toLocaleString("vi-VN")} đ</span>
                        ) : (
                          <span className="text-slate-800 text-sm">-{voucher.amount.toLocaleString("vi-VN")} đ</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {voucher.createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                          Hoàn thành ✓
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-poppins text-xs">
                      Không có chứng từ phát sinh trong kỳ {selectedPeriod}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: CÔNG NỢ ĐỢT */}
      {activeTab === "debts" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Đối Soát Công Nợ Đợt Đơn Hàng &amp; Nhà Cung Cấp</h3>
              <p className="text-xs text-slate-500 mt-0.5">Theo dõi tình hình thu nợ theo đợt đơn hàng của Khách hàng và trả nợ gối đầu Nhà cung cấp.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs font-poppins text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-3 px-4">Đối Tác Khách Hàng</th>
                  <th className="py-3 px-4 text-right">Tổng Giá Trị Đơn</th>
                  <th className="py-3 px-4 text-right">Đã Thu Nợ</th>
                  <th className="py-3 px-4 text-right">Còn Phải Thu</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Đợt Next</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Công ty Cổ phần Nội thất A</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">100,000,000đ</td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-950 font-bold">30,000,000đ</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-bold">70,000,000đ</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                      Chờ thu đợt 2 (40%)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Tập đoàn Đầu tư &amp; Xây dựng B</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">200,000,000đ</td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-950 font-bold">140,000,000đ</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-bold">60,000,000đ</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                      Chờ thu nghiệm thu đợt 3 (30%)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Office Adjustment Modal */}
      {editingOfficeEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              Hiệu Chỉnh OT &amp; Ghi Chú Phạt Đi Muộn - {editingOfficeEmp.name}
            </h3>

            <div className="space-y-3 text-xs font-poppins">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số giờ OT (Overtime):</label>
                <input
                  type="number"
                  defaultValue={editingOfficeEmp.otHours}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-950 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ghi chú &amp; Tiền phạt đi muộn (đ):</label>
                <input
                  type="text"
                  defaultValue={editingOfficeEmp.lateNote}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 mb-2 font-medium"
                />
                <input
                  type="number"
                  defaultValue={editingOfficeEmp.latePenaltyAmount}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-950 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingOfficeEmp(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => setEditingOfficeEmp(null)}
                className="bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer shadow-xs"
              >
                Lưu hiệu chỉnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN DUYỆT CHI */}
      {confirmingDisbursement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
            <button
              onClick={() => setConfirmingDisbursement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <span className="p-3 rounded-2xl bg-blue-50 text-blue-950 border border-blue-100">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xác Nhận Giải Ngân &amp; Duyệt Chi Lương</h3>
                <p className="text-[11px] text-slate-500 font-poppins">Thao tác này sẽ tự động lập Phiếu Chi &amp; tăng Tổng chi phí thực tế kỳ {selectedPeriod}.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 font-poppins text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Nhân sự nhận lương:</span>
                <span className="font-bold text-slate-900">{confirmingDisbursement.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Mã nhân viên:</span>
                <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">{confirmingDisbursement.code}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-700 font-bold">Số tiền giải ngân chi trả:</span>
                <span className="font-bold font-mono text-blue-950 text-base">{confirmingDisbursement.amount.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmingDisbursement(null)}
                className="flex-1 py-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-all cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeDisbursement}
                className="flex-1 py-2.5 rounded-full bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-xs transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận Duyệt Chi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LẬP PHIẾU THU MỚI THỦ CÔNG */}
      {showCreateReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCreateReceiptModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Lập Phiếu Thu Tiền Đợt Đơn Hàng Mới (Kỳ {selectedPeriod})
            </h3>

            <form onSubmit={handleCreateReceiptSubmit} className="space-y-3 text-xs font-poppins">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Khách hàng / Đối tác nộp tiền <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công ty Cổ phần Nội thất A"
                  value={receiptPartner}
                  onChange={(e) => setReceiptPartner(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 focus:bg-white font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hạng mục thu tiền</label>
                
                {/* Custom Floating Select Component */}
                <CustomSelect
                  value={receiptCategorySelect}
                  options={receiptCategoryOptions}
                  onChange={setReceiptCategorySelect}
                  pillShape="2xl"
                  className="w-full"
                />

                {receiptCategorySelect === "CUSTOM" && (
                  <input
                    type="text"
                    placeholder="Nhập tên hạng mục thu tiền tùy chỉnh..."
                    value={customReceiptCategory}
                    onChange={(e) => setCustomReceiptCategory(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 mt-2 font-medium"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số tiền thu thực tế (VNĐ) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-950 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ghi chú phiếu thu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thu qua chuyển khoản Vietcombank"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 focus:bg-white font-medium transition-all"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateReceiptModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer shadow-xs"
                >
                  Lập Phiếu Thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LẬP PHIẾU CHI MỚI THỦ CÔNG */}
      {showCreateExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCreateExpenseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Lập Phiếu Chi Mới (Kỳ {selectedPeriod})
            </h3>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-3 text-xs font-poppins">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Người nhận tiền / Nhà cung cấp <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhà cung cấp Gỗ Sồi An Cường"
                  value={expensePartner}
                  onChange={(e) => setExpensePartner(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 focus:bg-white font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hạng mục chi trả</label>
                
                {/* Custom Floating Select Component */}
                <CustomSelect
                  value={expenseCategorySelect}
                  options={expenseCategoryOptions}
                  onChange={setExpenseCategorySelect}
                  pillShape="2xl"
                  className="w-full"
                />

                {expenseCategorySelect === "CUSTOM" && (
                  <input
                    type="text"
                    placeholder="Nhập tên hạng mục chi tùy chỉnh..."
                    value={customExpenseCategory}
                    onChange={(e) => setCustomExpenseCategory(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 mt-2 font-medium"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số tiền chi thực tế (VNĐ) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-950 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ghi chú phiếu chi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chi tiền mặt tạm ứng vật tư"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-950 focus:bg-white font-medium transition-all"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateExpenseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer shadow-xs"
                >
                  Lập Phiếu Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
