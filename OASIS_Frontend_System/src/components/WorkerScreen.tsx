import { useState, useEffect, useRef } from "react";
import { 
  Users, Calendar, Clock, Plus, Search, CheckCircle2, AlertTriangle, 
  Info, Check, X, FileSpreadsheet, Sparkles, Building2, Hammer
} from "lucide-react";
import { getDailyWorkLogsApi, createDailyWorkLogApi, getTenantEmployeesApi } from "../api";

interface WorkerScreenProps {
  // Keeping interface matching to avoid breaking existing imports
  logs?: any[]; 
  onAddClockLog?: (log: any) => void;
  onAddLeaveRequest?: (req: any) => void;
}

// --------------------------------------------------------------------------
// REUSABLE BUBBLE CONCEPT CUSTOM DROPDOWN
// --------------------------------------------------------------------------
interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  className?: string;
}

function CustomSelect({ value, options, onChange, className = "" }: CustomSelectProps) {
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

  return (
    <div className="relative inline-block w-full font-sans text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between text-xs font-medium text-slate-800 hover:border-blue-950/40 hover:bg-white transition-all cursor-pointer ${className}`}
        style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-blue-950 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 w-full mt-1.5 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-1 max-h-56 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-blue-950 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-blue-950"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// CHEVRON DOWN FALLBACK FOR LOCAL RENDERING
// --------------------------------------------------------------------------
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// Fixed Scannable Workers with explicit department & roles
const MOCK_WORKERS = [
  { id: 6, name: "Nguyễn Công Binh", code: "GV-WKR-006", dept: "Phân xưởng Mộc", role: "Thợ Mộc Chính", avatar: "CB" },
  { id: 7, name: "Lê Văn Tùng", code: "GV-WKR-007", dept: "Phân xưởng Mộc", role: "Thợ Mộc Chính", avatar: "LT" },
  { id: 8, name: "Vũ Thị Hương", code: "GV-WKR-008", dept: "Phân xưởng Đóng gói", role: "Thợ Phụ Gỗ", avatar: "VH" },
  { id: 9, name: "Trần Văn C", code: "GV-WKR-009", dept: "Phân xưởng Mộc", role: "Thợ Mộc Chính", avatar: "VC" }
];

// Seeded Production stages
const PRODUCT_STAGES = [
  { id: 2, name: "2. Cắt gỗ & Tạo hình phôi", type: "piece_rate", rate: 30000 },
  { id: 3, name: "3. Lắp ráp kết cấu sản phẩm", type: "piece_rate", rate: 30000 }
];

const HOURLY_STAGES = [
  { id: 1, name: "1. Chuẩn bị nguyên vật liệu", type: "hourly", rate: 45000 },
  { id: 4, name: "4. Chà nhám & Sơn phủ PU", type: "hourly", rate: 45000 },
  { id: 5, name: "5. Đóng gói & Nhập kho thành phẩm", type: "hourly", rate: 45000 }
];

const SHIFT_OPTIONS = [
  "Ca Hành chính (08h - 17h)",
  "Ca Hành chính + OT (2h)",
  "Ca Hành chính + OT (3h)",
  "Nghỉ phép có đơn"
];

export default function WorkerScreen({}: WorkerScreenProps) {
  // Navigation Tabs: product (Piece-rate / Yield) vs hourly (Daily ca ngày / Giờ)
  const [activeTab, setActiveTab] = useState<"product" | "hourly">("product");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic workers from database
  const [dbWorkers, setDbWorkers] = useState<any[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  // History list of recent manually recorded logs
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal open states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Form states inside recording Modal
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [shiftName, setShiftName] = useState(SHIFT_OPTIONS[0]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [stageNameInput, setStageNameInput] = useState("");
  const [completedQuantity, setCompletedQuantity] = useState("10");
  const [hoursWorked, setHoursWorked] = useState("8");

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) {
      diffMins += 24 * 60;
    }
    
    let hours = diffMins / 60;
    if (hours > 5) {
      hours -= 1; // Trừ 1 giờ nghỉ trưa
    }
    setHoursWorked(hours.toFixed(1));
  };

  // Custom Alert Popup State
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    setAlertInfo({ isOpen: true, type, title, message });
  };

  // Load actual employees of the company from database
  const loadWorkers = async () => {
    setIsLoadingWorkers(true);
    try {
      const res = await getTenantEmployeesApi();
      if (res && res.data && res.data.length > 0) {
        // Ánh xạ dữ liệu nhân sự thực tế từ database vào cấu trúc cột bảng
        const mapped = res.data.map((emp: any) => ({
          id: emp.id,
          name: emp.fullname,
          code: emp.employeeCode || `NV-${emp.id}`,
          dept: emp.department?.name || "Phân xưởng",
          role: emp.position?.name || "Công nhân",
          avatar: emp.fullname.substring(0, 2).toUpperCase()
        }));
        setDbWorkers(mapped);
        return mapped;
      } else {
        // Fallback sang dữ liệu mẫu nếu DB trống
        setDbWorkers(MOCK_WORKERS);
        return MOCK_WORKERS;
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách nhân viên:", e);
      setDbWorkers(MOCK_WORKERS);
      return MOCK_WORKERS;
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  // Fetch recent daily logs for distribution overview
  const loadRecentLogs = async (workersList = dbWorkers) => {
    if (workersList.length === 0) {
      setIsLoadingHistory(false);
      return;
    }
    setIsLoadingHistory(true);
    try {
      // Gọi API lấy nhật ký công nhật của các nhân sự thực tế trong tháng 07/2026
      const promises = workersList.map((w: any) => 
        getDailyWorkLogsApi(w.id, "2026-07").catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      const combined = results.flatMap((res: any) => res.data || []);
      // Sắp xếp nhật ký mới nhất lên trên
      combined.sort((a: any, b: any) => {
        const dateA = new Date(a.workDate).getTime();
        const dateB = new Date(b.workDate).getTime();
        return dateB - dateA;
      });
      setRecentLogs(combined);
    } catch (e) {
      console.error("Lỗi khi tải lịch sử công:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (dbWorkers.length > 0) {
      loadRecentLogs(dbWorkers);
    }
  }, [dbWorkers]);

  // Filtered workers list
  const filteredWorkers = dbWorkers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal handler for selected worker
  const handleOpenRecordModal = (worker: any) => {
    setSelectedWorker(worker);
    setWorkDate(new Date().toISOString().split("T")[0]);
    setShiftName(SHIFT_OPTIONS[0]);
    setStartTime("08:00");
    setEndTime("17:00");
    
    // Autofill default stage name based on active tab
    if (activeTab === "product") {
      setStageNameInput("2. Cắt gỗ & Tạo hình phôi");
      setCompletedQuantity("10");
    } else {
      setStageNameInput("1. Chuẩn bị nguyên vật liệu");
      setHoursWorked("8.0");
    }
    
    setIsModalOpen(true);
  };

  // Submit manual logging payload
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      // Ánh xạ tên công đoạn nhập tay sang stageId tương ứng trong DB để đảm bảo khoá ngoại
      const text = stageNameInput.toLowerCase();
      let stageIdNum = activeTab === "product" ? 2 : 1; // Mặc định

      if (text.includes("chuẩn bị") || text.includes("vật tư") || text.includes("1")) {
        stageIdNum = 1;
      } else if (text.includes("cắt") || text.includes("tạo hình") || text.includes("2")) {
        stageIdNum = 2;
      } else if (text.includes("lắp ráp") || text.includes("kết cấu") || text.includes("3")) {
        stageIdNum = 3;
      } else if (text.includes("chà nhám") || text.includes("sơn") || text.includes("pu") || text.includes("4")) {
        stageIdNum = 4;
      } else if (text.includes("đóng gói") || text.includes("nhập kho") || text.includes("thành phẩm") || text.includes("5")) {
        stageIdNum = 5;
      }

      const payload = {
        employeeId: selectedWorker.id,
        employeeName: selectedWorker.name,
        stageId: stageIdNum,
        workDate: workDate,
        shiftName: activeTab === "hourly" ? `Ca từ ${startTime} đến ${endTime}` : shiftName,
        completedQuantity: activeTab === "product" ? Number(completedQuantity) : null,
        hoursWorked: activeTab === "hourly" ? Number(hoursWorked) : null
      };

      await createDailyWorkLogApi(payload);
      setIsModalOpen(false);
      const updatedWorkers = await loadWorkers();
      await loadRecentLogs(updatedWorkers);

      showAlert(
        "Ghi công thành công",
        `Đã hoàn thành ghi nhận công nhật hằng ngày cho công nhân ${selectedWorker.name} ở công đoạn "${stageNameInput}" ngày ${workDate}.`
      );
    } catch (err: any) {
      console.error(err);
      showAlert("Lỗi hệ thống", err.message || "Ghi nhận công nhật thất bại!", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="manual-attendance-dashboard" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-left">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
            <Users className="w-6 h-6 text-slate-teal mr-2" />
            Bảng Điều Hành Ghi Nhận Công Nhật Hằng Ngày
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận thủ công sản lượng khoán sản phẩm và công ngày theo giờ làm của công nhân cuối mỗi ngày.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab("product")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "product" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-slate-800"
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Ghi Công Sản Phẩm (Lương Khoán)</span>
          </button>
          <button
            onClick={() => setActiveTab("hourly")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "hourly" ? "bg-blue-950 text-white shadow-xs font-bold" : "hover:text-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ghi Công Ca Ngày / Giờ (Lương Giờ)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Workers list & History logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - 7 Columns: Worker List Card */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
              <Sparkles className="w-4 h-4 text-slate-teal mr-1.5" />
              Danh sách công nhân phân xưởng ({filteredWorkers.length})
            </h2>

            {/* Simple search bar */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Tìm kiếm công nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-teal font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Workers list table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                  <th className="p-3">Công nhân</th>
                  <th className="p-3">Mã số</th>
                  <th className="p-3">Tổ / Phân xưởng</th>
                  <th className="p-3">Vai trò chính</th>
                  <th className="p-3 text-center">Ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">Không tìm thấy công nhân phù hợp bộ lọc.</td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-3 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-950 border border-blue-100 flex items-center justify-center font-bold text-xs">
                          {worker.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{worker.name}</div>
                          <div className="text-[10px] text-slate-400">{worker.dept}</div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-500">{worker.code}</td>
                      <td className="p-3 text-slate-600">{worker.dept}</td>
                      <td className="p-3 text-slate-500">{worker.role}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenRecordModal(worker)}
                          className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                        >
                          {activeTab === "product" ? "Ghi sản lượng" : "Chấm công giờ"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>💡 <strong>Hướng dẫn:</strong> Bấm nút <strong>"Ghi sản lượng"</strong> hoặc <strong>"Chấm công giờ"</strong> cạnh tên công nhân để khai báo chi tiết công nhật thủ công cho người đó cuối mỗi ngày làm việc. Dữ liệu ghi nhận sẽ chuyển ngay thành tiền tích lũy và chuyển sang Kế toán.</span>
          </div>
        </div>

        {/* Right Column - 5 Columns: Recent logs history overview */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
              <FileSpreadsheet className="w-4.5 h-4.5 text-slate-teal mr-1.5" />
              Nhật ký ghi công thủ công gần đây
            </h2>
            <button
              onClick={() => loadRecentLogs()}
              className="text-[10px] text-blue-950 font-bold hover:underline cursor-pointer"
            >
              Làm mới ↻
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 font-sans text-xs">
            {isLoadingHistory ? (
              <div className="py-8 text-center text-slate-400 italic">Đang tải lịch sử công nhật...</div>
            ) : recentLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">Chưa có lượt chấm công nào được lưu trong tháng này.</div>
            ) : (
              recentLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between transition-all">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <span>{log.employeeName || "Công nhân"}</span>
                      <span className="text-[9px] font-mono bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded">{log.workDate}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Công đoạn: <strong className="text-slate-700">{log.stageName}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ca làm: {log.shiftName || "Hành chính"}
                    </div>
                    <div className="text-[10px] text-slate-400 italic">
                      Người ghi: <strong className="text-slate-600 font-sans">{log.approvedByName || "Quản lý SX"}</strong>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-slate-900 text-xs">
                      {log.completedQuantity ? `${log.completedQuantity} sp` : `${log.hoursWorked} giờ`}
                    </div>
                    <div className="font-mono font-bold text-emerald-600 text-[10px] mt-0.5">
                      {log.amount ? `+${log.amount.toLocaleString("vi-VN")}đ` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MANUAL DAILY WORK LOG POPUP MODAL */}
      {isModalOpen && selectedWorker && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                  {activeTab === "product" ? "Ghi nhận sản lượng khoán" : "Ghi nhận giờ công ca ngày"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Thực hiện cho thợ: <strong className="text-slate-700 font-sans">{selectedWorker.name} ({selectedWorker.code})</strong></p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs font-medium">
              
              {/* Ngày làm việc */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngày làm việc</label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                  required
                />
              </div>

              {/* Ca làm / Khung giờ (Lương khoán) hoặc Từ giờ -> Đến giờ (Lương giờ) */}
              {activeTab === "product" ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ca làm việc</label>
                  <CustomSelect
                    value={shiftName}
                    onChange={(val) => setShiftName(val)}
                    options={SHIFT_OPTIONS.map(s => ({ value: s, label: s }))}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Từ giờ</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        calculateHours(e.target.value, endTime);
                      }}
                      className="w-full bg-slate-50 focus:bg-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đến giờ</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        calculateHours(startTime, e.target.value);
                      }}
                      className="w-full bg-slate-50 focus:bg-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Công đoạn sản xuất mẫu */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhập công đoạn sản xuất</label>
                <input
                  type="text"
                  value={stageNameInput}
                  onChange={(e) => setStageNameInput(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                  placeholder="Nhập tên công đoạn (Ví dụ: Cắt gỗ, Lắp ráp, Chà nhám, Đóng gói...)"
                  required
                />
              </div>

              {/* Số lượng hoặc Giờ làm dựa trên Tab đang chọn */}
              {activeTab === "product" ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số lượng sản lượng đạt chuẩn (sản phẩm)</label>
                  <input
                    type="number"
                    value={completedQuantity}
                    onChange={(e) => setCompletedQuantity(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số giờ làm việc thực tế (giờ)</label>
                  <input
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-200 outline-none transition-all"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                  />
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-lg cursor-pointer text-center"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
                >
                  Xác nhận ghi công ✓
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- REUSABLE SYSTEM ALERT DIALOG POPUP MODAL --- */}
      {alertInfo && alertInfo.isOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 border border-slate-100 rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
              alertInfo.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : alertInfo.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-blue-50 border-blue-100 text-blue-950"
            }`}>
              {alertInfo.type === "success" ? (
                <Check className="w-6 h-6" />
              ) : alertInfo.type === "error" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-[14px] font-bold text-slate-800" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}>
                {alertInfo.title}
              </h3>
              <p className="text-xs text-slate-500 font-poppins leading-relaxed">
                {alertInfo.message}
              </p>
            </div>

            <button
              onClick={() => setAlertInfo(null)}
              className="w-full py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 450 }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
