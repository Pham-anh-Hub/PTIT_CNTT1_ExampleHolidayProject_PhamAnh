import { useState, useTransition, useMemo } from "react";
import { Employee, Contract } from "../types";
import { DEPARTMENTS, POSITIONS } from "../data";
import { Search, UserPlus, FolderTree, FileText, Plus, CheckCircle, Clock, Ban, UploadCloud, X, CreditCard } from "lucide-react";

interface HRMScreenProps {
  employees: Employee[];
  contracts: Contract[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onAddContract: (contract: Contract) => void;
}

export default function HRMScreen({
  employees,
  contracts,
  onAddEmployee,
  onUpdateEmployee,
  onAddContract
}: HRMScreenProps) {
  const [, startTransition] = useTransition();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees.find((e) => e.status !== "RESIGNED")?.id || employees[0]?.id || ""
  );
  const [activeTab, setActiveTab] = useState<"profile" | "contracts">("profile");

  // State for adding a new employee
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addBirth, setAddBirth] = useState("1995-01-01");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addDept, setAddDept] = useState("HR");
  const [addPos, setAddPos] = useState("HR_STAFF");
  const [addStatus, setAddStatus] = useState<"PROBATION" | "ACTIVE">("PROBATION");
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // State for adding a new contract
  const [showContractModal, setShowContractModal] = useState(false);
  const [newContractType, setNewContractType] = useState("Hợp đồng Xác định thời hạn (1 năm)");
  const [newContractSalary, setNewContractSalary] = useState(12000000);
  const [newContractStartDate, setNewContractStartDate] = useState("2026-07-15");
  const [newContractEndDate, setNewContractEndDate] = useState("2027-07-15");
  const [dragOver, setDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // Find currently selected employee
  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId);

  // Form edit states for selected employee (binds to state when selected employee changes)
  const [editName, setEditName] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editPos, setEditPos] = useState("");
  const [editStatus, setEditStatus] = useState<"PROBATION" | "ACTIVE" | "RESIGNED">("ACTIVE");

  // Update edit form fields whenever a new employee is clicked
  useMemo(() => {
    if (selectedEmployee) {
      setEditName(selectedEmployee.fullname);
      setEditBirth(selectedEmployee.birthday);
      setEditEmail(selectedEmployee.email);
      setEditPhone(selectedEmployee.phone);
      setEditDept(selectedEmployee.departmentId);
      setEditPos(selectedEmployee.positionId);
      setEditStatus(selectedEmployee.status);
    }
  }, [selectedEmployeeId, selectedEmployee]);

  // Handle employee profile save
  const handleSaveProfile = () => {
    if (!selectedEmployee) return;
    onUpdateEmployee({
      ...selectedEmployee,
      fullname: editName,
      birthday: editBirth,
      email: editEmail,
      phone: editPhone,
      departmentId: editDept,
      positionId: editPos,
      status: editStatus
    });
    setToast({ message: "Cập nhật thông tin hồ sơ thành công!", type: "success" });
  };

  // Filter employees list by department selection and search query (excluding resigned employees from the roster)
  const filteredEmployees = employees.filter((emp) => {
    const isNotResigned = emp.status !== "RESIGNED";
    const matchesDept = selectedDeptId === "ALL" || emp.departmentId === selectedDeptId;
    const matchesSearch =
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotResigned && matchesDept && matchesSearch;
  });

  // Get selected employee's contract list
  const selectedEmployeeContracts = contracts.filter(
    (c) => c.employeeId === selectedEmployeeId
  );

  // Create contract form submission
  const handleSubmitContract = () => {
    if (!selectedEmployee) return;

    const contractCode = `HĐ-GV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newContract: Contract = {
      id: `con-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fullname,
      code: contractCode,
      type: newContractType,
      startDate: newContractStartDate,
      endDate: newContractEndDate || "None",
      basicSalary: Number(newContractSalary),
      status: "PENDING",
      attachmentName: attachedFile || "duthao_hdld_moi.pdf"
    };

    onAddContract(newContract);
    setShowContractModal(false);
    setAttachedFile(null);
    setToast({
      message: `Đã lập dự thảo ${contractCode} thành công và gửi lên Ban giám đốc (BOD) duyệt.`,
      type: "success"
    });
  };

  // Add new employee after validated modal submission
  const handleAddNewEmployeeSubmit = () => {
    if (!addName.trim()) {
      setAddModalError("Họ và tên không được để trống.");
      return;
    }
    if (!addEmail.trim()) {
      setAddModalError("Email không được để trống.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addEmail.trim())) {
      setAddModalError("Email không đúng định dạng (Ví dụ: name@goviet.com).");
      return;
    }
    if (!addPhone.trim()) {
      setAddModalError("Số điện thoại không được để trống.");
      return;
    }

    const nextCodeNum = employees.length + 101;
    const empCode = `GV-${nextCodeNum}`;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      fullname: addName.trim(),
      code: empCode,
      birthday: addBirth,
      email: addEmail.trim(),
      phone: addPhone.trim(),
      departmentId: addDept,
      positionId: addPos,
      status: addStatus
    };

    onAddEmployee(newEmp);
    setSelectedEmployeeId(newEmp.id);
    setActiveTab("profile");
    setShowAddEmployeeModal(false);

    // Reset Form Fields
    setAddName("");
    setAddBirth("1995-01-01");
    setAddEmail("");
    setAddPhone("");
    setAddDept("HR");
    setAddPos("HR_STAFF");
    setAddStatus("PROBATION");
    setAddModalError(null);

    setToast({
      message: `Thêm mới thành công nhân sự ${newEmp.fullname} (${newEmp.code})`,
      type: "success"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="hrm-workspace-view">
      {/* Upper Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">
            Quản Lý Nhân Sự &amp; Dự Thảo Hợp Đồng (HRM)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thiết kế Split-layout tối ưu màn hình Desktop giúp HR quản lý cây phòng ban và soạn thảo hợp đồng lao động nhanh chóng.
          </p>
        </div>
        <button
          onClick={() => setShowAddEmployeeModal(true)}
          className="bg-slate-teal hover:bg-slate-teal-hover text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all duration-200"
          id="btn-add-employee-trigger"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Hồ Sơ Nhân Sự</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="hrm-split-layout">
        {/* Left Column: Department List and Employee Roster - 4 columns */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm min-h-[500px]">
          <div>
            {/* Dept Selector with Tree Icon */}
            <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs mb-3">
              <FolderTree className="w-4 h-4 text-slate-teal" />
              <span>Phòng Ban &amp; Cơ Cấu Tổ Chức</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setSelectedDeptId("ALL")}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  selectedDeptId === "ALL"
                    ? "bg-slate-teal text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                TẤT CẢ ({employees.filter((e) => e.status !== "RESIGNED").length})
              </button>
              {DEPARTMENTS.map((dept) => {
                const count = employees.filter((e) => e.departmentId === dept.id && e.status !== "RESIGNED").length;
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedDeptId === dept.id
                        ? "bg-slate-teal text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {dept.id} ({count})
                  </button>
                );
              })}
            </div>

            {/* Instant Search Bar */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhân sự nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-slate-teal focus:bg-white transition-all"
              />
            </div>

            {/* Employees Roster List */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[11px]">
                  Không tìm thấy hồ sơ nhân sự phù hợp.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const deptObj = DEPARTMENTS.find((d) => d.id === emp.departmentId);
                  const isSelected = selectedEmployeeId === emp.id;

                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedEmployeeId(emp.id);
                        });
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? "bg-slate-teal-light text-slate-teal font-semibold shadow-sm border-l-2 border-slate-teal"
                          : "hover:bg-slate-50 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">{emp.fullname}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">
                          {emp.code} · {deptObj?.name.split(" ")[0]}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        emp.status === "ACTIVE"
                          ? "bg-emerald-green-light text-emerald-green-dark"
                          : emp.status === "PROBATION"
                          ? "bg-sage-amber-light text-sage-amber-dark"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {emp.status === "ACTIVE" ? "Chính thức" : emp.status === "PROBATION" ? "Thử việc" : "Nghỉ việc"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-50 pt-3 font-mono">
            Tổng hồ sơ trong hệ thống: {employees.length} nhân sự
          </div>
        </div>

        {/* Right Column: Detailed View (Personal info & active contracts) - 8 columns */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[500px]" id="hrm-detailed-canvas">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Detailed Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-teal-light text-slate-teal font-display font-bold text-lg flex items-center justify-center rounded-xl">
                    {selectedEmployee.fullname.split(" ").pop()?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{selectedEmployee.fullname}</h2>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 uppercase">
                      MÃ NHÂN SỰ: {selectedEmployee.code} · {DEPARTMENTS.find((d) => d.id === selectedEmployee.departmentId)?.name}
                    </div>
                  </div>
                </div>

                {/* Tab switch buttons */}
                <div className="flex bg-slate-50 p-1 rounded-xl self-start sm:self-center border border-slate-100">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "profile"
                        ? "bg-white text-slate-teal shadow"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Hồ Sơ Cá Nhân
                  </button>
                  <button
                    onClick={() => setActiveTab("contracts")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "contracts"
                        ? "bg-white text-slate-teal shadow"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Hợp Đồng Lao Động ({selectedEmployeeContracts.length})
                  </button>
                </div>
              </div>

              {/* Tab Content 1: Personal Profile Form */}
              {activeTab === "profile" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Thông tin nhân sự cơ bản
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Fullname input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Họ và Tên</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal focus:ring-2 focus:ring-slate-teal-light/50"
                      />
                    </div>

                    {/* Birthday Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Ngày sinh</label>
                      <input
                        type="date"
                        value={editBirth}
                        onChange={(e) => setEditBirth(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      />
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Điện thoại liên hệ</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Hòm thư điện tử (Email)</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      />
                    </div>

                    {/* Department Dropdown with automatic filtered roles */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Phòng ban chính</label>
                      <select
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Chức danh / Vị trí</label>
                      <select
                        value={editPos}
                        onChange={(e) => setEditPos(e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      >
                        {POSITIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Trạng thái nhân sự</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                      >
                        <option value="PROBATION">Thử việc (Probation)</option>
                        <option value="ACTIVE">Chính thức (Active)</option>
                        <option value="RESIGNED">Đã thôi việc (Resigned)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-50">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-slate-teal hover:bg-slate-teal-hover text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                      id="btn-save-hrm-profile"
                    >
                      Cập Nhật Thay Đổi
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Employment Contracts History */}
              {activeTab === "contracts" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lịch sử hợp đồng lao động
                    </h3>
                    <button
                      onClick={() => setShowContractModal(true)}
                      className="text-xs text-slate-teal hover:text-slate-teal-hover font-semibold inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Soạn Hợp Đồng Mới</span>
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                          <th className="p-3">Số hợp đồng</th>
                          <th className="p-3">Loại hợp đồng</th>
                          <th className="p-3">Hiệu lực</th>
                          <th className="p-3 text-right">Mức lương CB</th>
                          <th className="p-3 text-right">Duyệt bởi</th>
                          <th className="p-3 pr-4 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedEmployeeContracts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                              Nhân sự chưa có hợp đồng nào được lưu trữ trong hệ thống. Click "Soạn Hợp đồng mới" để dự thảo.
                            </td>
                          </tr>
                        ) : (
                          selectedEmployeeContracts.map((con) => (
                            <tr key={con.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-3 font-semibold text-slate-700 font-mono">{con.code}</td>
                              <td className="p-3 font-medium text-slate-600">{con.type}</td>
                              <td className="p-3 text-slate-500 font-mono">
                                {con.startDate} → {con.endDate === "None" ? "Vô thời hạn" : con.endDate}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-800 font-semibold">
                                {con.basicSalary.toLocaleString("vi-VN")} đ
                              </td>
                              <td className="p-3 text-right text-slate-500 text-[11px]">{con.approvedBy || "—"}</td>
                              <td className="p-3 pr-4 text-right">
                                {con.status === "APPROVED" ? (
                                  <span className="inline-flex items-center space-x-1 text-[9px] bg-emerald-green-light text-emerald-green font-bold px-1.5 py-0.5 rounded">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    <span>Đã duyệt</span>
                                  </span>
                                ) : con.status === "PENDING" ? (
                                  <span className="inline-flex items-center space-x-1 text-[9px] bg-sage-amber-light text-sage-amber font-bold px-1.5 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>BOD đang duyệt</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[9px] bg-terracotta-light text-terracotta font-bold px-1.5 py-0.5 rounded">
                                    <Ban className="w-2.5 h-2.5" />
                                    <span>Bị từ chối</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              Chưa có nhân viên nào được lựa chọn.
            </div>
          )}
        </div>
      </div>

      {/* SOẠN HỢP ĐỒNG MỚI POPUP MODAL (600px width matching 4.6b) */}
      {showContractModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-200" id="contract-creator-modal">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Soạn thảo Hợp đồng lao động mới</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nhân sự: <strong className="text-slate-700">{selectedEmployee.fullname}</strong> ({selectedEmployee.code})
                </p>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Forms */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contract type dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Loại hợp đồng ký kết</label>
                  <select
                    value={newContractType}
                    onChange={(e) => setNewContractType(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  >
                    <option value="Hợp đồng Thử việc (2 tháng)">Hợp đồng Thử việc (2 tháng)</option>
                    <option value="Hợp đồng Xác định thời hạn (1 năm)">Hợp đồng Xác định thời hạn (1 năm)</option>
                    <option value="Hợp đồng Xác định thời hạn (3 năm)">Hợp đồng Xác định thời hạn (3 năm)</option>
                    <option value="Hợp đồng Không xác định thời hạn">Hợp đồng Không xác định thời hạn</option>
                  </select>
                </div>

                {/* Monthly Basic Salary input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Mức lương cơ bản thỏa thuận (VND)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newContractSalary}
                      onChange={(e) => setNewContractSalary(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 pr-8 focus:outline-none focus:border-slate-teal font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">ĐỒNG</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Ngày bắt đầu hiệu lực</label>
                  <input
                    type="date"
                    value={newContractStartDate}
                    onChange={(e) => setNewContractStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Ngày hết hạn dự kiến</label>
                  <input
                    type="date"
                    value={newContractEndDate}
                    onChange={(e) => setNewContractEndDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  />
                </div>
              </div>

              {/* Upload Contract Document Attachments (Drag & Drop Simulation) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Bản Scan / Chứng từ thảo hợp đồng (.pdf, .docx)</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      setAttachedFile(files[0].name);
                    }
                  }}
                  onClick={() => {
                    // Simulate selecting a dummy file
                    setAttachedFile(`duthao_hdld_${selectedEmployee.fullname.toLowerCase().replace(/\s+/g, '_')}_scan.pdf`);
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    attachedFile
                      ? "border-emerald-green bg-emerald-green-light/30"
                      : dragOver
                      ? "border-slate-teal bg-slate-teal-light/50"
                      : "border-slate-200 hover:border-slate-teal bg-slate-50/50"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <UploadCloud className={`w-8 h-8 ${attachedFile ? "text-emerald-green" : "text-slate-400"}`} />
                    {attachedFile ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Đã đính kèm file thành công!</p>
                        <p className="text-[10px] text-emerald-green-dark font-mono mt-0.5">{attachedFile}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Kéo thả file hợp đồng vào đây hoặc click để duyệt file</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ định dạng PDF hoặc DOCX tối đa 15MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Micro-feedback alert */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start space-x-2 text-slate-600 leading-normal">
                <CreditCard className="w-4 h-4 text-slate-teal shrink-0 mt-0.5" />
                <span>
                  Quy trình nghiệp vụ: Sau khi lưu dự thảo, hợp đồng sẽ được đẩy vào <strong>Hộp thư phê duyệt của BOD</strong>. Kỳ tính lương sau đó sẽ tự động mở khóa theo mức lương thỏa thuận khi BOD bấm duyệt.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 justify-end">
              <button
                onClick={() => {
                  setShowContractModal(false);
                  setAttachedFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-colors font-medium"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={handleSubmitContract}
                className="px-5 py-2 rounded-xl text-xs bg-slate-teal hover:bg-slate-teal-hover text-white font-semibold transition-colors shadow-sm"
              >
                Gửi duyệt lên BOD
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-200" id="employee-creator-modal">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Thêm hồ sơ nhân sự mới</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Vui lòng điền đầy đủ các trường thông tin dưới đây để lưu hồ sơ vào hệ thống.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setAddModalError(null);
                }}
                className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {addModalError && (
              <div className="bg-red-50 text-red-600 text-xs p-2.5 rounded-lg border border-red-100 font-medium">
                {addModalError}
              </div>
            )}

            {/* Modal Body Forms */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fullname */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Họ và Tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal focus:ring-2 focus:ring-slate-teal-light/50"
                  />
                </div>

                {/* Birthday */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Ngày sinh</label>
                  <input
                    type="date"
                    value={addBirth}
                    onChange={(e) => setAddBirth(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Hòm thư (Email) <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="name@company.vn"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Điện thoại liên hệ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dept */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Phòng ban</label>
                  <select
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Vị trí chức danh</label>
                  <select
                    value={addPos}
                    onChange={(e) => setAddPos(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  >
                    {POSITIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Trạng thái ban đầu</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:outline-none focus:border-slate-teal"
                  >
                    <option value="PROBATION">Thử việc (Probation)</option>
                    <option value="ACTIVE">Chính thức (Active)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 justify-end">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setAddModalError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-colors font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddNewEmployeeSubmit}
                className="px-5 py-2 rounded-xl text-xs bg-slate-teal hover:bg-slate-teal-hover text-white font-semibold transition-colors shadow-sm"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating State Toast overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-100 shadow-xl rounded-2xl p-4 max-w-sm flex items-start space-x-3 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-green shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-semibold text-slate-700 leading-relaxed">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
