import { useState, useEffect, useContext } from "react";
import {
  Users, UserCheck, ShieldAlert, Layers, Search, Plus,
  Trash2, Edit, CheckCircle2, AlertCircle, Shield, X,
  ChevronDown, Settings, Building, MapPin, Phone, Mail, HelpCircle, Activity, Globe
} from "lucide-react";
import {
  getTenantEmployeesApi,
  createTenantEmployeeApi,
  updateTenantEmployeeApi,
  updateEmployeeAccountStatusApi,
  assignEmployeeRolesApi,
  getTenantDepartmentsApi,
  getTenantPositionsApi,
  getTenantRolesApi,
  getTenantCompanyProfileApi,
  updateTenantCompanyProfileApi,
  getTenantApprovalSettingsApi,
  updateTenantApprovalSettingsApi,
  createTenantDepartmentApi,
  updateTenantDepartmentApi,
  deleteTenantDepartmentApi,
  createTenantPositionApi,
  updateTenantPositionApi,
  deleteTenantPositionApi
} from "../api";
import { Tenant, User as UserType } from "../types";
import { AuthContext } from "../context/AuthContext";
import { TenantContext } from "../context/TenantContext";

interface BusinessAdminScreenProps {
  activeTab: string;
  selectedDepartmentId?: string | number | null;
}

export default function BusinessAdminScreen({
  activeTab,
  selectedDepartmentId = null
}: BusinessAdminScreenProps) {
  const authCtx = useContext(AuthContext);
  const tenantCtx = useContext(TenantContext);
  const currentUser = authCtx?.currentUser as UserType | null;
  const currentTenant = (tenantCtx?.currentTenant ?? { id: "", name: "", industry: "", subdomain: "", logo: "", taxCode: "" }) as Tenant;
  // Tình trạng tải và thông tin chung
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dữ liệu danh mục
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState<string | number>(selectedDepartmentId || "ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Tab con trong Cổng Quản trị Doanh nghiệp: "accounts" hoặc "settings"
  const [adminActiveTab, setAdminActiveTab] = useState<"accounts" | "settings">("accounts");

  // State các Popup
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  // Dữ liệu tương tác tạm thời
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // States cho Form Thêm nhân sự
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmpCode, setAddEmpCode] = useState("");
  const [addDeptId, setAddDeptId] = useState<number>(0);
  const [addPosId, setAddPosId] = useState<number>(0);
  const [addRoleId, setAddRoleId] = useState<number>(0);
  const [addHasAccount, setAddHasAccount] = useState(true);
  const [addPassword, setAddPassword] = useState("Oasis@12345");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Custom Dropdowns cho Form Thêm nhân sự
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [addPosOpen, setAddPosOpen] = useState(false);
  const [addRoleOpen, setAddRoleOpen] = useState(false);

  // States cho Form Sửa nhân sự
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editDeptId, setEditDeptId] = useState<number>(0);
  const [editPosId, setEditPosId] = useState<number>(0);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Custom Dropdowns cho Form Sửa
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [editPosOpen, setEditPosOpen] = useState(false);

  // States cho Form phân quyền kiêm nhiệm (Role Assignment)
  const [roleAssignments, setRoleAssignments] = useState<Array<{ departmentId: number; roleId: number; isDefault: boolean }>>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  // States cho Bộ lọc chính (Filter Dropdowns)
  const [isFilterDeptOpen, setIsFilterDeptOpen] = useState(false);
  const [isFilterStatusOpen, setIsFilterStatusOpen] = useState(false);

  // States cho Thiết lập Doanh nghiệp (Settings)
  const [subSettingsTab, setSubSettingsTab] = useState<"profile" | "approvals" | "departments">("profile");
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // States cho Cấu hình Phê duyệt (Tab 2)
  const [approvalSettings, setApprovalSettings] = useState<any[]>([]);
  const [isFetchingApprovals, setIsFetchingApprovals] = useState(false);
  const [isSavingApprovals, setIsSavingApprovals] = useState(false);

  // States cho Cơ cấu Tổ chức (Tab 3)
  const [orgSubTab, setOrgSubTab] = useState<"departments" | "positions">("departments");
  
  // Modals & Forms cho Phòng ban
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptParentId, setDeptParentId] = useState<number | "">("");
  const [isSavingDept, setIsSavingDept] = useState(false);

  // Modals & Forms cho Chức danh
  const [showPosModal, setShowPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<any | null>(null);
  const [posName, setPosName] = useState("");
  const [posDesc, setPosDesc] = useState("");
  const [isSavingPos, setIsSavingPos] = useState(false);

  const [settName, setSettName] = useState(currentTenant?.name || "");
  const [settAddress, setSettAddress] = useState(currentTenant?.address || "");
  const [settPhone, setSettPhone] = useState(currentTenant?.phone || "");
  const [settEmail, setSettEmail] = useState(currentTenant?.email || "");
  const [settPlan, setSettPlan] = useState(currentTenant?.subscriptionPlan || "TRIAL");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Đồng bộ hóa khi click từ các phòng ban cụ thể bên Sidebar
  useEffect(() => {
    if (selectedDepartmentId !== null) {
      setFilterDept(selectedDepartmentId);
    } else {
      setFilterDept("ALL");
    }
  }, [selectedDepartmentId]);

  // Đồng bộ hóa thiết lập khi currentTenant thay đổi
  useEffect(() => {
    if (currentTenant) {
      setSettName(currentTenant.name || "");
      setSettAddress(currentTenant.address || "");
      setSettPhone(currentTenant.phone || "");
      setSettEmail(currentTenant.email || "");
      setSettPlan(currentTenant.subscriptionPlan || "TRIAL");
    }
  }, [currentTenant]);

  // Tải hồ sơ doanh nghiệp từ API (Tab Thiết lập)
  const fetchCompanyProfile = async () => {
    try {
      setIsFetchingProfile(true);
      setSettingsError(null);
      const res = await getTenantCompanyProfileApi();
      if (res && res.data) {
        const company = res.data;
        setSettName(company.name || "");
        setSettAddress(company.address || "");
        setSettPhone(company.phone || "");
        setSettEmail(company.email || "");
        setSettPlan(company.subscriptionPlan || "TRIAL");
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || "Không thể tải hồ sơ doanh nghiệp từ máy chủ.");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // Tự động fetch hồ sơ doanh nghiệp khi chuyển qua tab thiết lập doanh nghiệp
  useEffect(() => {
    if (activeTab === "tenant-admin-settings" && subSettingsTab === "profile") {
      fetchCompanyProfile();
    }
  }, [activeTab, subSettingsTab]);

  // Tải cấu hình phê duyệt từ API (Tab Thiết lập)
  const fetchApprovalSettings = async () => {
    try {
      setIsFetchingApprovals(true);
      setSettingsError(null);
      const res = await getTenantApprovalSettingsApi();
      if (res && res.data) {
        setApprovalSettings(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || "Không thể tải cấu hình phê duyệt từ máy chủ.");
    } finally {
      setIsFetchingApprovals(false);
    }
  };

  // Cập nhật cấu hình phê duyệt lên API
  const handleSaveApprovalSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSuccess(null);

    // Validation kiểm tra ngưỡng tiền phải >= 0
    for (const rule of approvalSettings) {
      if (rule.ruleType === "ORDER_AMOUNT_THRESHOLD" && rule.isEnabled) {
        const val = Number(rule.thresholdValue);
        if (isNaN(val) || val < 0) {
          setSettingsError("Ngưỡng tiền phê duyệt đơn hàng phải là một số dương hợp lệ.");
          return;
        }
      }
    }

    try {
      setIsSavingApprovals(true);
      const dtos = approvalSettings.map(rule => ({
        id: rule.id,
        ruleType: rule.ruleType,
        thresholdValue: Number(rule.thresholdValue) || 0,
        isEnabled: !!rule.isEnabled
      }));

      await updateTenantApprovalSettingsApi(dtos);
      setSuccess("Cập nhật cấu hình phê duyệt thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchApprovalSettings();
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || "Lưu cấu hình phê duyệt thất bại.");
    } finally {
      setIsSavingApprovals(false);
    }
  };

  // Tự động fetch cấu hình phê duyệt khi chuyển qua tab cấu hình phê duyệt
  useEffect(() => {
    if (activeTab === "tenant-admin-settings" && subSettingsTab === "approvals") {
      fetchApprovalSettings();
    }
  }, [activeTab, subSettingsTab]);

  // ==================== PHÒNG BAN HANDLERS ====================
  const handleOpenAddDeptModal = () => {
    setEditingDept(null);
    setDeptName("");
    setDeptCode("");
    setDeptDesc("");
    setDeptParentId("");
    setSettingsError(null);
    setShowDeptModal(true);
  };

  const handleOpenEditDeptModal = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name || "");
    setDeptCode(dept.code || "");
    setDeptDesc(dept.description || "");
    setDeptParentId(dept.parentDepartmentId || "");
    setSettingsError(null);
    setShowDeptModal(true);
  };

  const handleSaveDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    if (!deptName.trim()) {
      setSettingsError("Tên phòng ban không được để trống.");
      return;
    }
    if (!deptCode.trim()) {
      setSettingsError("Mã phòng ban không được để trống.");
      return;
    }

    try {
      setIsSavingDept(true);
      const dto = {
        name: deptName.trim(),
        code: deptCode.trim(),
        description: deptDesc.trim() || undefined,
        parentDepartmentId: deptParentId === "" ? undefined : Number(deptParentId)
      };

      if (editingDept) {
        await updateTenantDepartmentApi(editingDept.id, dto);
        setSuccess("Cập nhật phòng ban thành công!");
      } else {
        await createTenantDepartmentApi(dto);
        setSuccess("Thêm mới phòng ban thành công!");
      }

      setShowDeptModal(false);
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || "Không thể lưu thông tin phòng ban.");
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleDeleteDept = async (deptId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng ban này? Tất cả các hồ sơ đang trực thuộc phòng ban này sẽ cần cấu hình lại.")) {
      return;
    }

    try {
      setError(null);
      await deleteTenantDepartmentApi(deptId);
      setSuccess("Xóa phòng ban thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Xóa phòng ban thất bại.");
    }
  };

  // ==================== CHỨC DANH HANDLERS ====================
  const handleOpenAddPosModal = () => {
    setEditingPos(null);
    setPosName("");
    setPosDesc("");
    setSettingsError(null);
    setShowPosModal(true);
  };

  const handleOpenEditPosModal = (pos: any) => {
    setEditingPos(pos);
    setPosName(pos.name || "");
    setPosDesc(pos.description || "");
    setSettingsError(null);
    setShowPosModal(true);
  };

  const handleSavePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    if (!posName.trim()) {
      setSettingsError("Tên chức danh không được để trống.");
      return;
    }

    try {
      setIsSavingPos(true);
      const dto = {
        name: posName.trim(),
        description: posDesc.trim() || undefined
      };

      if (editingPos) {
        await updateTenantPositionApi(editingPos.id, dto);
        setSuccess("Cập nhật chức danh thành công!");
      } else {
        await createTenantPositionApi(dto);
        setSuccess("Thêm mới chức danh thành công!");
      }

      setShowPosModal(false);
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || "Không thể lưu thông tin chức danh.");
    } finally {
      setIsSavingPos(false);
    }
  };

  const handleDeletePos = async (posId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chức danh này?")) {
      return;
    }

    try {
      setError(null);
      await deleteTenantPositionApi(posId);
      setSuccess("Xóa chức danh thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Xóa chức danh thất bại.");
    }
  };

  // Hàm tải dữ liệu tổng thể từ Backend
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi đồng thời các API lấy danh mục và danh sách nhân sự
      const [deptsRes, posRes, rolesRes, empsRes] = await Promise.all([
        getTenantDepartmentsApi().catch(() => ({ data: [] })),
        getTenantPositionsApi().catch(() => ({ data: [] })),
        getTenantRolesApi().catch(() => ({ data: [] })),
        getTenantEmployeesApi().catch(() => ({ data: [] }))
      ]);

      const fetchedDepts = deptsRes.data || [];
      const fetchedPositions = posRes.data || [];
      const fetchedRoles = rolesRes.data || [];
      const fetchedEmployees = empsRes.data || [];

      setDepartments(fetchedDepts);
      setPositions(fetchedPositions);
      setRoles(fetchedRoles);
      setEmployees(fetchedEmployees);

      // Điền giá trị mặc định cho Form Thêm nếu danh mục có sẵn
      if (fetchedDepts.length > 0) setAddDeptId(fetchedDepts[0].id);
      if (fetchedPositions.length > 0) setAddPosId(fetchedPositions[0].id);
      if (fetchedRoles.length > 0) setAddRoleId(fetchedRoles[0].id);

    } catch (err: any) {
      console.error(err);
      setError("Không thể nạp dữ liệu từ máy chủ. Vui lòng kiểm tra lại trạng thái Server Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Tính toán số liệu thống kê thực tế
  const totalEmployees = employees.length;
  const totalWithAccount = employees.filter(e => e.user !== null).length;
  const totalActive = employees.filter(e => e.user !== null && e.user.isActive).length;
  const totalLocked = employees.filter(e => e.user !== null && !e.user.isActive).length;
  const totalDeptsCount = departments.length;

  // Tính toán thống kê Donut Chart tỷ lệ nhân sự theo phòng ban
  const deptStats = departments.map(d => {
    const count = employees.filter(e => e.department && e.department.id === d.id).length;
    const pct = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      count,
      pct
    };
  });

  // Tìm kiếm & Lọc trên giao diện
  const filteredEmployees = employees.filter(e => {
    // 1. Tìm kiếm theo tên hoặc mã nhân sự hoặc email
    const matchSearch = searchTerm.trim() === "" ||
      (e.fullname && e.fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.employeeCode && e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Lọc theo Phòng ban
    const matchDept = filterDept === "ALL" || (e.department && e.department.id.toString() === filterDept.toString());

    // 3. Lọc theo Trạng thái
    let matchStatus = true;
    const cleanEmpStatus = e.status ? e.status.toUpperCase() : "";
    if (filterStatus === "ACTIVE_WEB") {
      matchStatus = e.user !== null && e.user.isActive;
    } else if (filterStatus === "LOCKED_WEB") {
      matchStatus = e.user !== null && !e.user.isActive;
    } else if (filterStatus === "NO_ACCOUNT") {
      matchStatus = e.user === null;
    } else if (filterStatus === "HR_ACTIVE") {
      matchStatus = cleanEmpStatus === "ACTIVE" || cleanEmpStatus === "CHÍNH THỨC" || cleanEmpStatus === "CHINH THUC";
    } else if (filterStatus === "HR_PROBATION") {
      matchStatus = cleanEmpStatus === "PROBATION" || cleanEmpStatus === "THỬ VIỆC" || cleanEmpStatus === "THU VIEC";
    } else if (filterStatus === "HR_RESIGNED") {
      matchStatus = cleanEmpStatus === "RESIGNED" || cleanEmpStatus === "ĐÃ NGHỈ VIỆC" || cleanEmpStatus === "NGHỈ VIỆC" || cleanEmpStatus === "NGHI VIEC";
    }

    return matchSearch && matchDept && matchStatus;
  });

  // Mở Popup Thêm mới nhân sự
  const handleOpenAddModal = () => {
    setAddName("");
    setAddEmail("");
    setAddPhone("");
    setAddEmpCode("");
    if (departments.length > 0) setAddDeptId(departments[0].id);
    if (positions.length > 0) setAddPosId(positions[0].id);
    if (roles.length > 0) setAddRoleId(roles[0].id);
    setAddHasAccount(true);
    setAddPassword("Oasis@12345");
    setAddErrors({});
    setShowAddModal(true);
  };

  // Submit Thêm mới nhân sự
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!addName.trim()) errors.name = "Họ và tên không được để trống";
    if (!addEmail.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail.trim())) {
      errors.email = "Email không đúng định dạng";
    }
    if (addHasAccount && !addPassword) {
      errors.password = "Mật khẩu cho tài khoản không được để trống";
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    try {
      setIsAdding(true);
      await createTenantEmployeeApi({
        fullname: addName.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim() || undefined,
        employeeCode: addEmpCode.trim() || undefined,
        departmentId: addDeptId,
        positionId: addPosId,
        roleId: addRoleId,
        status: "ACTIVE",
        createAccount: addHasAccount,
        password: addHasAccount ? addPassword : undefined
      });
      setShowAddModal(false);
      setSuccess("Khởi tạo nhân sự mới thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Tạo hồ sơ nhân sự thất bại.");
    } finally {
      setIsAdding(false);
    }
  };

  // Mở Popup Sửa thông tin
  const handleOpenEditModal = (emp: any) => {
    setSelectedEmployee(emp);
    setEditName(emp.fullname || "");
    setEditPhone(emp.phone || "");
    setEditStatus(emp.status || "ACTIVE");
    setEditDeptId(emp.department ? emp.department.id : (departments[0]?.id || 0));
    setEditPosId(emp.position ? emp.position.id : (positions[0]?.id || 0));
    setEditErrors({});
    setShowEditModal(true);
  };

  // Submit Sửa thông tin
  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!editName.trim()) errors.name = "Họ và tên không được để trống";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setIsEditing(true);
      await updateTenantEmployeeApi(selectedEmployee.id, {
        fullname: editName.trim(),
        phone: editPhone.trim() || undefined,
        status: editStatus,
        departmentId: editDeptId,
        positionId: editPosId
      });
      setShowEditModal(false);
      setSuccess("Cập nhật thông tin nhân viên thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setIsEditing(false);
    }
  };

  // Mở Popup khóa/mở khóa
  const handleOpenStatusModal = (emp: any) => {
    setSelectedEmployee(emp);
    setShowStatusModal(true);
  };

  // Submit thay đổi trạng thái tài khoản
  const handleToggleAccountStatusSubmit = async () => {
    if (!selectedEmployee || !selectedEmployee.user) return;
    try {
      const currentActive = selectedEmployee.user.isActive;
      await updateEmployeeAccountStatusApi(selectedEmployee.id, !currentActive);
      setShowStatusModal(false);
      setSuccess(currentActive ? "Đã tạm khóa tài khoản đăng nhập!" : "Đã mở khóa tài khoản đăng nhập!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Thay đổi trạng thái tài khoản thất bại.");
    }
  };

  // Mở Popup Phân quyền kiêm nhiệm
  const handleOpenRolesModal = (emp: any) => {
    setSelectedEmployee(emp);

    // Nếu nhân sự đã có các vai trò kiêm nhiệm (hoặc gán vai trò mặc định)
    // Ta lấy từ Backend hoặc map mặc định nếu chưa có
    const initialAssignments: any[] = [];
    if (emp.user && emp.user.userRoleDepartments) {
      emp.user.userRoleDepartments.forEach((urd: any) => {
        initialAssignments.push({
          departmentId: urd.department.id,
          roleId: urd.role.id,
          isDefault: urd.isDefault || false
        });
      });
    }

    // Nếu trống rỗng hoàn toàn, thêm 1 dòng mặc định với phòng ban/vai trò hiện tại của họ
    if (initialAssignments.length === 0) {
      initialAssignments.push({
        departmentId: emp.department ? emp.department.id : (departments[0]?.id || 0),
        roleId: roles.find(r => r.name === "WORKER" || r.name === "EMPLOYEE")?.id || (roles[0]?.id || 0),
        isDefault: true
      });
    }

    setRoleAssignments(initialAssignments);
    setShowRolesModal(true);
  };

  // Thêm dòng kiêm nhiệm mới
  const handleAddRoleAssignmentRow = () => {
    setRoleAssignments(prev => [
      ...prev,
      {
        departmentId: departments[0]?.id || 0,
        roleId: roles[0]?.id || 0,
        isDefault: false
      }
    ]);
  };

  // Xóa dòng kiêm nhiệm
  const handleRemoveRoleAssignmentRow = (index: number) => {
    setRoleAssignments(prev => prev.filter((_, i) => i !== index));
  };

  // Cập nhật giá trị dòng kiêm nhiệm
  const handleUpdateAssignmentRow = (index: number, key: string, value: any) => {
    setRoleAssignments(prev => prev.map((item, i) => {
      if (i !== index) return item;

      // Nếu đặt dòng này làm mặc định, bắt buộc phải tắt mặc định ở tất cả dòng khác
      if (key === "isDefault" && value === true) {
        // Cần cập nhật tất cả dòng khác thành false
        return { ...item, [key]: value };
      }
      return { ...item, [key]: value };
    }));

    if (key === "isDefault" && value === true) {
      setRoleAssignments(prev => prev.map((item, i) => {
        if (i === index) return { ...item, isDefault: true };
        return { ...item, isDefault: false };
      }));
    }
  };

  // Submit lưu phân quyền kiêm nhiệm
  const handleSaveRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleAssignments.length === 0) {
      alert("Danh sách vai trò và phòng ban kiêm nhiệm không được để trống.");
      return;
    }

    const defaultCount = roleAssignments.filter(a => a.isDefault).length;
    if (defaultCount !== 1) {
      alert("Bắt buộc phải chọn duy nhất 1 Phòng ban & Vai trò làm cấu hình mặc định (Mặc định = Có).");
      return;
    }

    try {
      setIsSavingRoles(true);
      await assignEmployeeRolesApi(selectedEmployee.id, roleAssignments);
      setShowRolesModal(false);
      setSuccess("Cập nhật phân quyền kiêm nhiệm thành công!");
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Lưu thông tin kiêm nhiệm thất bại.");
    } finally {
      setIsSavingRoles(false);
    }
  };

  // Submit Lưu thiết lập công ty (Settings)
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSuccess(null);

    // Frontend validation
    if (!settName.trim()) {
      setSettingsError("Tên doanh nghiệp không được để trống.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settEmail.trim() && !emailRegex.test(settEmail.trim())) {
      setSettingsError("Hộp thư Email giao dịch không hợp lệ.");
      return;
    }

    try {
      setIsSavingSettings(true);
      await updateTenantCompanyProfileApi({
        name: settName.trim(),
        address: settAddress.trim(),
        phone: settPhone.trim(),
        email: settEmail.trim(),
        subscriptionPlan: settPlan
      });
      setSuccess("Cập nhật thiết lập doanh nghiệp thành công!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setSettingsError(err.message || "Lưu thiết lập thất bại.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Hàm hiển thị Badge trạng thái cựu/đang làm việc
  const getEmpStatusBadge = (statusName: string) => {
    const cleanStatus = statusName ? statusName.toUpperCase() : "";
    if (cleanStatus === "ACTIVE" || cleanStatus === "CHÍNH THỨC" || cleanStatus === "CHINH THUC") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Hồ sơ: Chính thức
        </span>
      );
    }
    if (cleanStatus === "PROBATION" || cleanStatus === "THỬ VIỆC" || cleanStatus === "THU VIEC") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Hồ sơ: Thử việc
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Hồ sơ: Nghỉ việc
      </span>
    );
  };

  // Hàm hiển thị Badge tài khoản Web
  const getUserStatusBadge = (emp: any) => {
    if (!emp.user) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Tài khoản: Chưa cấp
        </span>
      );
    }
    if (emp.user.isActive) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-bold flex items-center gap-1 w-fit" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Tài khoản: Hoạt động
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-bold flex items-center gap-1 w-fit" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Tài khoản: Đang khóa
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 relative overflow-hidden pb-12" id="business-admin-view">
      {/* Background Bubble Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-950/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-slate-teal/5 rounded-full blur-3xl -z-10" />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3.5 border-b border-slate-100">
        <div>
          <h1
            className="text-2xl font-black text-slate-800 tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {activeTab === "tenant-admin-dashboard" && "Tổng quan Dashboard"}
            {(activeTab === "tenant-admin-accounts" || activeTab.startsWith("tenant-admin-accounts-dept-")) && "Nhân sự & Tài khoản"}
            {activeTab === "tenant-admin-settings" && "Thiết lập doanh nghiệp"}
          </h1>
          <p
            className="text-[13px] text-slate-400 font-medium mt-1 leading-none flex items-center gap-1.5"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <Building className="w-4 h-4 text-slate-400" />
            Quản trị doanh nghiệp: <strong className="text-blue-950 font-bold">{currentTenant?.name}</strong>
          </p>
        </div>
      </div>

      {/* Notifications Alerts */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-800 animate-in slide-in-from-top-3 duration-250">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{success}</span>
        </div>
      )}

      {loading && employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Đang đồng bộ hóa dữ liệu quản trị doanh nghiệp...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] text-left flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Lỗi kết nối</h4>
            <p className="text-[11px] text-rose-600 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW 1: TỔNG QUAN DASHBOARD */}
          {activeTab === "tenant-admin-dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">

              {/* TOP CARDS: DASHBOARD METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

                {/* Metric 1: Total staff */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-950/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3 text-slate-400">
                    <Users className="w-5 h-5 text-blue-950 shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Tổng nhân sự</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-2.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {totalEmployees} <span className="text-xs font-medium text-slate-400">người</span>
                  </div>
                </div>

                {/* Metric 2: Accounts granted */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-950/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3 text-slate-400">
                    <UserCheck className="w-5 h-5 text-blue-950 shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Đã cấp Account</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-2.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {totalWithAccount} <span className="text-xs font-medium text-slate-400">user</span>
                  </div>
                </div>

                {/* Metric 3: Active accounts */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Đang hoạt động</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mt-2.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {totalActive} <span className="text-xs font-medium text-emerald-400">tài khoản</span>
                  </div>
                </div>

                {/* Metric 4: Locked accounts */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Đang bị khóa</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600 mt-2.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {totalLocked} <span className="text-xs font-medium text-rose-400">tài khoản</span>
                  </div>
                </div>

                {/* Metric 5: Departments count */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-slate-teal/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3 text-slate-400">
                    <Layers className="w-5 h-5 text-blue-950 shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Tổng phòng ban</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-2.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {totalDeptsCount} <span className="text-xs font-medium text-slate-400">bộ phận</span>
                  </div>
                </div>

              </div>

              {/* INTERMEDIATE GRID: DONUT CHART + FAST ACTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SVG DONUT CHART: Staff distribution */}
                <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-md text-left flex flex-col justify-between relative overflow-hidden lg:col-span-2">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-950/5 rounded-full blur-xl pointer-events-none" />

                  <h3
                    className="text-sm font-black text-slate-800 flex items-center mb-6"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <Activity className="w-5.5 h-5.5 text-blue-950 mr-2 shrink-0" />
                    Cơ cấu Phân bổ Nhân sự theo Phòng ban
                  </h3>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                    {/* SVG Graphic */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        {totalEmployees === 0 ? (
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
                        ) : (
                          (() => {
                            let accumulatedOffset = 0;
                            // Các mã màu cho từng phòng ban
                            const colors = ["hsl(221, 83%, 24%)", "hsl(38, 92%, 50%)", "hsl(145, 55%, 43%)", "hsl(190, 75%, 45%)", "hsl(280, 65%, 55%)"];
                            return deptStats.map((ds, idx) => {
                              if (ds.pct === 0) return null;
                              const strokeArray = `${ds.pct} ${100 - ds.pct}`;
                              const offset = accumulatedOffset;
                              accumulatedOffset += ds.pct;
                              return (
                                <circle
                                  key={ds.id}
                                  cx="18"
                                  cy="18"
                                  r="15.915"
                                  fill="none"
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="4.5"
                                  strokeDasharray={strokeArray}
                                  strokeDashoffset={`-${offset}`}
                                />
                              );
                            });
                          })()
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 leading-none">{totalEmployees}</span>
                        <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">Nhân sự</span>
                      </div>
                    </div>

                    {/* Legend labels */}
                    <div className="space-y-2.5 text-left text-xs font-bold text-slate-500 max-h-40 overflow-y-auto pr-2">
                      {deptStats.map((ds, idx) => {
                        const colors = ["bg-blue-950", "bg-amber-500", "bg-emerald-500", "bg-sky-400", "bg-purple-500"];
                        return (
                          <div key={ds.id} className="flex items-center space-x-2.5">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${colors[idx % colors.length]}`}></span>
                            <span style={{ fontFamily: "'Poppins', sans-serif" }}>
                              {ds.name}: <strong className="text-slate-700 font-black">{ds.count} người</strong> ({ds.pct.toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* FAST OPERATIONS SUMMARY */}
                <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-md text-left flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-sm font-black text-slate-800 flex items-center mb-3"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <Shield className="w-5.5 h-5.5 text-blue-950 mr-2 shrink-0" />
                      Quyền hạn Doanh nghiệp
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Hệ thống tự động cô lập cơ sở dữ liệu nhân sự của riêng doanh nghiệp. Các thao tác thêm mới nhân viên, cấp tài khoản và cấu hình phân quyền kiêm nhiệm phòng ban đều được phân quyền nghiêm ngặt và kiểm soát.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddModal}
                    className="w-full py-3 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-98 text-xs font-bold text-white shadow-lg shadow-blue-950/15 flex items-center justify-center gap-2 cursor-pointer transition-all mt-6"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <Plus className="w-4 h-4" />
                    Thêm nhân sự & Cấp tài khoản
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* VIEW 2: NHÂN SỰ & TÀI KHOẢN */}
          {(activeTab === "tenant-admin-accounts" || activeTab.startsWith("tenant-admin-accounts-dept-")) && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* MAIN ACCOUNTS LIST & FILTERS TABLE (Bubble Panel) */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-md text-left">

                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

                  {/* Search box with custom icon */}
                  <div className="relative w-full lg:max-w-xs">
                    <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm tên, mã thợ, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-600 focus:outline-none focus:border-blue-950 focus:bg-white transition-all font-medium"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Dept filter selector */}
                    <div className="flex items-center space-x-2.5 relative">
                      <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider animate-in fade-in" style={{ fontFamily: "'Poppins', sans-serif" }}>Phòng ban:</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFilterDeptOpen(!isFilterDeptOpen);
                            setIsFilterStatusOpen(false);
                          }}
                          className="pl-4 pr-9 py-2.5 bg-slate-50/90 hover:bg-slate-100/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-950 transition-all cursor-pointer shadow-sm flex items-center justify-between min-w-[170px]"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          <span>
                            {filterDept === "ALL" ? "Tất cả phòng ban" : (departments.find(d => d.id.toString() === filterDept.toString())?.name || "Tất cả phòng ban")}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 absolute right-2.5 transition-transform duration-200 ${isFilterDeptOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isFilterDeptOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsFilterDeptOpen(false)} />
                            <div className="absolute left-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 min-w-[180px] max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterDept("ALL");
                                  setIsFilterDeptOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${filterDept === "ALL" ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Tất cả phòng ban
                              </button>
                              {departments.map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    setFilterDept(d.id.toString());
                                    setIsFilterDeptOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${filterDept.toString() === d.id.toString() ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  style={{ fontFamily: "'Poppins', sans-serif" }}
                                >
                                  {d.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status filter selector */}
                    <div className="flex items-center space-x-2.5 relative">
                      <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider animate-in fade-in" style={{ fontFamily: "'Poppins', sans-serif" }}>Bộ lọc:</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFilterStatusOpen(!isFilterStatusOpen);
                            setIsFilterDeptOpen(false);
                          }}
                          className="pl-4 pr-9 py-2.5 bg-slate-50/90 hover:bg-slate-100/60 border border-slate-200 rounded-2xl text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-950 transition-all cursor-pointer shadow-sm flex items-center justify-between min-w-[185px]"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          <span>
                            {filterStatus === "ALL" && "Tất cả trạng thái"}
                            {filterStatus === "ACTIVE_WEB" && "Đang hoạt động"}
                            {filterStatus === "LOCKED_WEB" && "Đang khóa"}
                            {filterStatus === "NO_ACCOUNT" && "Chưa cấp tài khoản"}
                            {filterStatus === "HR_ACTIVE" && "Hồ sơ: Chính thức"}
                            {filterStatus === "HR_PROBATION" && "Hồ sơ: Thử việc"}
                            {filterStatus === "HR_RESIGNED" && "Hồ sơ: Nghỉ việc"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 absolute right-2.5 transition-transform duration-200 ${isFilterStatusOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isFilterStatusOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsFilterStatusOpen(false)} />
                            <div className="absolute left-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-150">
                              {[
                                { val: "ALL", label: "Tất cả trạng thái" },
                                { val: "ACTIVE_WEB", label: "Đang hoạt động" },
                                { val: "LOCKED_WEB", label: "Đang khóa" },
                                { val: "NO_ACCOUNT", label: "Chưa cấp tài khoản" },
                                { val: "HR_ACTIVE", label: "Hồ sơ: Chính thức" },
                                { val: "HR_PROBATION", label: "Hồ sơ: Thử việc" },
                                { val: "HR_RESIGNED", label: "Hồ sơ: Nghỉ việc" }
                              ].map(item => (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => {
                                    setFilterStatus(item.val);
                                    setIsFilterStatusOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${filterStatus === item.val ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  style={{ fontFamily: "'Poppins', sans-serif" }}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Table data display */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Họ tên & Mã</th>
                        <th className="py-3 px-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Phòng ban / Chức vụ</th>
                        <th className="py-3 px-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Tài khoản đăng nhập</th>
                        <th className="py-3 px-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Trạng thái</th>
                        <th className="py-3 px-4 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs text-slate-400 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Không tìm thấy nhân sự/tài khoản nào phù hợp với bộ lọc!
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <tr
                            key={emp.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            {/* Column 1: Avatar, Name & Code */}
                            <td className="py-3 px-4 flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-full bg-blue-950 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                                {emp.fullname ? emp.fullname.split(" ").pop().substring(0, 2).toUpperCase() : "NV"}
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>{emp.fullname}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{emp.employeeCode || "Chưa cấp mã"}</div>
                              </div>
                            </td>

                            {/* Column 2: Dept + Position */}
                            <td className="py-3 px-4">
                              <span className="text-[11px] font-extrabold text-slate-700 block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                {emp.department ? emp.department.name : "Không rõ"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                {emp.position ? emp.position.name : "Nhân viên"}
                              </span>
                            </td>

                            {/* Column 3: Web Login Account */}
                            <td className="py-3 px-4">
                              {emp.user ? (
                                <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  {emp.user.email}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-450 italic font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                  Không có quyền truy cập web
                                </span>
                              )}
                            </td>

                            {/* Column 4: Status badges */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                {getEmpStatusBadge(emp.status)}
                                {getUserStatusBadge(emp)}
                              </div>
                            </td>

                            {/* Column 5: Action buttons */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                {/* Edit info */}
                                <button
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-950 transition-colors cursor-pointer"
                                  title="Chỉnh sửa lý lịch"
                                >
                                  <Edit className="w-4.5 h-4.5" />
                                </button>

                                {/* Phân quyền kiêm nhiệm */}
                                <button
                                  onClick={() => handleOpenRolesModal(emp)}
                                  disabled={!emp.user}
                                  className={`p-1.5 rounded-lg transition-colors ${emp.user
                                      ? "text-slate-500 hover:bg-slate-100 hover:text-blue-950 cursor-pointer"
                                      : "text-slate-200 cursor-not-allowed"
                                    }`}
                                  title={emp.user ? "Phân quyền kiêm nhiệm vai trò" : "Nhân viên chưa được cấp tài khoản để phân quyền"}
                                >
                                  <Shield className="w-4.5 h-4.5" />
                                </button>

                                {/* Lock/Unlock */}
                                <button
                                  onClick={() => {
                                    if (emp.user && emp.user.email === currentUser?.email) {
                                      alert("Bạn không thể tự khóa tài khoản của chính mình!");
                                      return;
                                    }
                                    handleOpenStatusModal(emp);
                                  }}
                                  disabled={!emp.user || (emp.user && emp.user.email === currentUser?.email)}
                                  className={`p-1.5 rounded-lg transition-colors ${(!emp.user || (emp.user && emp.user.email === currentUser?.email))
                                      ? "text-slate-200 cursor-not-allowed"
                                      : "text-slate-500 hover:bg-slate-100 hover:text-rose-600 cursor-pointer"
                                    }`}
                                  title={
                                    !emp.user
                                      ? "Không có tài khoản"
                                      : emp.user.email === currentUser?.email
                                        ? "Bạn không thể tự khóa tài khoản của chính mình"
                                        : emp.user.isActive
                                          ? "Tạm khóa tài khoản Web"
                                          : "Kích hoạt lại tài khoản Web"
                                  }
                                >
                                  <ShieldAlert className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 3: THIẾT LẬP DOANH NGHIỆP */}
          {activeTab === "tenant-admin-settings" && (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[32px] pt-5 pb-8 px-8 shadow-md text-left relative overflow-hidden animate-in fade-in duration-300 w-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

              {/* Sub-tab Bar */}
              <div className="flex border-b border-slate-100 pb-3 mb-6 space-x-6">
                <button
                  type="button"
                  onClick={() => setSubSettingsTab("profile")}
                  className={`pb-2 text-xs font-bold transition-all relative ${
                    subSettingsTab === "profile" 
                      ? "text-blue-950 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-950 after:rounded-full" 
                      : "text-slate-400 hover:text-slate-650 cursor-pointer"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hồ sơ công ty
                </button>
                <button
                  type="button"
                  onClick={() => setSubSettingsTab("approvals")}
                  className={`pb-2 text-xs font-bold transition-all relative ${
                    subSettingsTab === "approvals" 
                      ? "text-blue-950 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-950 after:rounded-full" 
                      : "text-slate-400 hover:text-slate-650 cursor-pointer"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Cấu hình Phê duyệt
                </button>
                <button
                  type="button"
                  onClick={() => setSubSettingsTab("departments")}
                  className={`pb-2 text-xs font-bold transition-all relative ${
                    subSettingsTab === "departments" 
                      ? "text-blue-950 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-blue-950 after:rounded-full" 
                      : "text-slate-400 hover:text-slate-650 cursor-pointer"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Cơ cấu tổ chức
                </button>
              </div>

              {/* Tab 1: Hồ sơ công ty */}
              {subSettingsTab === "profile" && (
                <>
                  {settingsError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-800 animate-in slide-in-from-top-3 duration-250 mb-5">
                      <AlertCircle className="w-5 h-5 text-rose-650 shrink-0" />
                      <span className="text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{settingsError}</span>
                    </div>
                  )}

                  {isFetchingProfile ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 text-xs font-bold animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Đang tải thông tin hồ sơ doanh nghiệp...
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveSettingsSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                          Tên doanh nghiệp / Công ty khách hàng <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settName}
                          disabled={isSavingSettings}
                          onChange={(e) => setSettName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                          Địa chỉ trụ sở văn phòng
                        </label>
                        <input
                          type="text"
                          value={settAddress}
                          disabled={isSavingSettings}
                          onChange={(e) => setSettAddress(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                            Số điện thoại liên lạc
                          </label>
                          <input
                            type="text"
                            value={settPhone}
                            disabled={isSavingSettings}
                            onChange={(e) => setSettPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                            Hộp thư Email giao dịch
                          </label>
                          <input
                            type="text"
                            value={settEmail}
                            disabled={isSavingSettings}
                            onChange={(e) => setSettEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                          Gói dịch vụ đăng ký
                        </label>
                        <div className="px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-between cursor-not-allowed select-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          <span>{settPlan} Plan - Vận hành SaaS</span>
                          <span className="text-[10px] text-slate-400 font-normal">Chỉ Super Admin hệ thống có quyền đổi gói dịch vụ</span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="px-6 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none text-xs font-bold text-white shadow-md shadow-blue-950/15 cursor-pointer transition-all flex items-center gap-2"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {isSavingSettings && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                          {isSavingSettings ? "Đang lưu..." : "Lưu thiết lập"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Tab 2: Cấu hình Phê duyệt */}
              {subSettingsTab === "approvals" && (
                <>
                  {settingsError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-800 animate-in slide-in-from-top-3 duration-250 mb-5">
                      <AlertCircle className="w-5 h-5 text-rose-650 shrink-0" />
                      <span className="text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{settingsError}</span>
                    </div>
                  )}

                  {isFetchingApprovals ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 text-xs font-bold animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Đang tải cấu hình phê duyệt...
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveApprovalSettingsSubmit} className="space-y-6">
                      <div className="space-y-4">
                        {approvalSettings.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Chưa có quy tắc phê duyệt nào được khởi tạo.
                          </div>
                        ) : (
                          approvalSettings.map((rule, idx) => {
                            const isOrder = rule.ruleType === "ORDER_AMOUNT_THRESHOLD";
                            const isContract = rule.ruleType === "CONTRACT_APPROVAL";
                            const isProd = rule.ruleType === "PRODUCTION_PLAN_APPROVAL";

                            let titleText = "Quy tắc không xác định";
                            let descText = "Mô tả quy tắc cấu hình phê duyệt.";

                            if (isOrder) {
                              titleText = "Phê duyệt Đơn hàng bán";
                              descText = "Kích hoạt kiểm tra phê duyệt tự động khi giá trị đơn hàng vượt ngưỡng quy định.";
                            } else if (isContract) {
                              titleText = "Phê duyệt Hợp đồng lao động";
                              descText = "Yêu cầu cấp trên phê duyệt trước khi ký kết hoặc gia hạn hợp đồng lao động.";
                            } else if (isProd) {
                              titleText = "Phê duyệt Kế hoạch sản xuất";
                              descText = "Yêu cầu ban giám đốc thông qua bản thảo kế hoạch sản xuất trước khi vận hành.";
                            }

                            return (
                              <div
                                key={rule.id || idx}
                                className="p-5 border border-slate-100 rounded-[24px] bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50"
                              >
                                <div className="space-y-1">
                                  <h4 className="text-xs font-black text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {titleText}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {descText}
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  {isOrder && rule.isEnabled && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-605" style={{ fontFamily: "'Roboto', sans-serif" }}>
                                        Ngưỡng duyệt (VND):
                                      </span>
                                      <input
                                        type="number"
                                        value={rule.thresholdValue}
                                        disabled={isSavingApprovals}
                                        onChange={(e) => {
                                          const updated = [...approvalSettings];
                                          updated[idx].thresholdValue = e.target.value;
                                          setApprovalSettings(updated);
                                        }}
                                        className="w-36 px-3 py-1.5 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-950 transition-all font-semibold"
                                        style={{ fontFamily: "'Poppins', sans-serif" }}
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      disabled={isSavingApprovals}
                                      onClick={() => {
                                        const updated = [...approvalSettings];
                                        updated[idx].isEnabled = !updated[idx].isEnabled;
                                        setApprovalSettings(updated);
                                      }}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        rule.isEnabled ? "bg-blue-950" : "bg-slate-200"
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          rule.isEnabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingApprovals || approvalSettings.length === 0}
                          className="px-6 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none text-xs font-bold text-white shadow-md shadow-blue-950/15 cursor-pointer transition-all flex items-center gap-2"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {isSavingApprovals && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                          {isSavingApprovals ? "Đang lưu..." : "Lưu cấu hình"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Tab 3: Cơ cấu tổ chức */}
              {subSettingsTab === "departments" && (
                <div className="space-y-6">
                  {/* Org Sub-menu */}
                  <div className="flex space-x-4 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setOrgSubTab("departments")}
                      className={`pb-1.5 text-xs font-bold transition-all relative ${
                        orgSubTab === "departments"
                          ? "text-blue-950 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-950"
                          : "text-slate-400 hover:text-slate-650 cursor-pointer"
                      }`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Cơ cấu Phòng ban
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrgSubTab("positions")}
                      className={`pb-1.5 text-xs font-bold transition-all relative ${
                        orgSubTab === "positions"
                          ? "text-blue-950 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-950"
                          : "text-slate-400 hover:text-slate-650 cursor-pointer"
                      }`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Danh sách Chức danh
                    </button>
                  </div>

                  {/* Section 1: Departments */}
                  {orgSubTab === "departments" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          Quản lý danh sách các phòng ban chức năng của doanh nghiệp.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddDeptModal}
                          className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm phòng ban
                        </button>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Mã phòng ban</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Tên phòng ban</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Mô tả</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Trực thuộc phòng</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 text-center" style={{ fontFamily: "'Roboto', sans-serif" }}>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {departments.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Chưa có phòng ban nào được thiết lập.
                                  </td>
                                </tr>
                              ) : (
                                departments.map((dept) => {
                                  const parentDeptName = departments.find(d => d.id === dept.parentDepartmentId)?.name || "-";
                                  return (
                                    <tr key={dept.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                      <td className="py-2.5 px-4 text-xs font-bold text-blue-950" style={{ fontFamily: "'Poppins', sans-serif" }}>{dept.code}</td>
                                      <td className="py-2.5 px-4 text-xs font-semibold text-slate-700" style={{ fontFamily: "'Poppins', sans-serif" }}>{dept.name}</td>
                                      <td className="py-2.5 px-4 text-[11px] text-slate-405" style={{ fontFamily: "'Poppins', sans-serif" }}>{dept.description || "-"}</td>
                                      <td className="py-2.5 px-4 text-xs font-medium text-slate-500" style={{ fontFamily: "'Poppins', sans-serif" }}>{parentDeptName}</td>
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center justify-center space-x-2">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditDeptModal(dept)}
                                            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-blue-950 transition-colors cursor-pointer animate-in fade-in"
                                            title="Sửa phòng ban"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDept(dept.id)}
                                            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-rose-650 transition-colors cursor-pointer animate-in fade-in"
                                            title="Xóa phòng ban"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Positions */}
                  {orgSubTab === "positions" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          Quản lý các chức danh / vị trí công việc phục vụ phân quyền hoạt động nhân sự.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddPosModal}
                          className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm chức danh
                        </button>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Tên chức danh / Chức vụ</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500" style={{ fontFamily: "'Roboto', sans-serif" }}>Mô tả</th>
                                <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 text-center" style={{ fontFamily: "'Roboto', sans-serif" }}>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positions.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-8 text-center text-slate-400 text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Chưa có chức danh nào được thiết lập.
                                  </td>
                                </tr>
                              ) : (
                                positions.map((pos) => (
                                  <tr key={pos.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2.5 px-4 text-xs font-bold text-slate-700" style={{ fontFamily: "'Poppins', sans-serif" }}>{pos.name}</td>
                                    <td className="py-2.5 px-4 text-[11px] text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>{pos.description || "-"}</td>
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center justify-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditPosModal(pos)}
                                          className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-blue-950 transition-colors cursor-pointer"
                                          title="Sửa chức danh"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePos(pos.id)}
                                          className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                                          title="Xóa chức danh"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* POPUP 1: FORM THÊM NHÂN SỰ & CẤP TÀI KHOẢN (Click Outside to Close) */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-left cursor-default max-h-[90vh] flex flex-col p-0 overflow-hidden"
            id="employee-add-popup-form"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5 shrink-0">
              <h3
                className="text-lg font-black text-slate-800 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Plus className="w-5.5 h-5.5 text-blue-950" />
                Khởi tạo Nhân sự & Tài khoản
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inset scrollable body wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 max-h-[calc(90vh-75px)]">
              <form id="add-employee-form" onSubmit={handleAddEmployeeSubmit} className="pl-8 pr-6.5 py-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Họ và tên nhân sự <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${addErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                      }`}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                  {addErrors.name && (
                    <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{addErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Email (Dùng đăng nhập) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="example@company.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${addErrors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                        }`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                    {addErrors.email && (
                      <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{addErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0987654321"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-150 font-medium"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mã nhân viên (Hệ thống tự sinh nếu trống)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: GV-HR-1002"
                      value={addEmpCode}
                      onChange={(e) => setAddEmpCode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-150 font-medium"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  {/* Custom select 1: Department selection */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Phòng ban trực thuộc
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setAddDeptOpen(!addDeptOpen);
                          setAddPosOpen(false);
                          setAddRoleOpen(false);
                        }}
                        className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium text-left cursor-pointer flex items-center justify-between"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <span>{departments.find(d => d.id === addDeptId)?.name || "Chọn phòng ban"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${addDeptOpen ? "rotate-180" : ""}`} />
                      </button>

                      {addDeptOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setAddDeptOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 max-h-40 overflow-y-auto">
                            {departments.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setAddDeptId(d.id);
                                  setAddDeptOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${addDeptId === d.id ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                {d.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom select 2: Position selection */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Chức danh nghiệp vụ
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setAddPosOpen(!addPosOpen);
                          setAddDeptOpen(false);
                          setAddRoleOpen(false);
                        }}
                        className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium text-left cursor-pointer flex items-center justify-between"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <span>{positions.find(p => p.id === addPosId)?.name || "Chọn chức danh"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${addPosOpen ? "rotate-180" : ""}`} />
                      </button>

                      {addPosOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setAddPosOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 max-h-40 overflow-y-auto">
                            {positions.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setAddPosId(p.id);
                                  setAddPosOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${addPosId === p.id ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Custom select 3: Role selection */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Vai trò đăng nhập mặc định
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setAddRoleOpen(!addRoleOpen);
                          setAddDeptOpen(false);
                          setAddPosOpen(false);
                        }}
                        className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium text-left cursor-pointer flex items-center justify-between"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <span>{roles.find(r => r.id === addRoleId)?.description || roles.find(r => r.id === addRoleId)?.name || "Chọn vai trò"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${addRoleOpen ? "rotate-180" : ""}`} />
                      </button>

                      {addRoleOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setAddRoleOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 max-h-40 overflow-y-auto">
                            {roles.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setAddRoleId(r.id);
                                  setAddRoleOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${addRoleId === r.id ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                {r.description || r.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkbox: Create Login Account options */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-start space-x-3.5">
                  <input
                    type="checkbox"
                    id="addHasAccount"
                    checked={addHasAccount}
                    onChange={(e) => setAddHasAccount(e.target.checked)}
                    className="w-4.5 h-4.5 mt-0.5 accent-blue-950 cursor-pointer"
                  />
                  <div className="text-left">
                    <label htmlFor="addHasAccount" className="text-xs font-black text-slate-800 cursor-pointer block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Cấp phát tài khoản đăng nhập Web
                    </label>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Tự động tạo tài khoản đăng nhập tương ứng với địa chỉ Email bên trên, cho phép nhân viên đăng nhập Cổng công nhân.
                    </p>
                  </div>
                </div>

                {addHasAccount && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mật khẩu đăng nhập mặc định <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${addErrors.password ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                        }`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                    {addErrors.password && (
                      <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{addErrors.password}</p>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 px-8 py-6 border-t border-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="add-employee-form"
                disabled={isAdding}
                className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isAdding ? "Đang tạo..." : "Tạo nhân sự"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: FORM SỬA LÝ LỊCH NHÂN VIÊN (Click Outside to Close) */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-left cursor-default max-h-[90vh] flex flex-col p-0 overflow-hidden"
            id="employee-edit-popup-form"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5 shrink-0">
              <h3
                className="text-lg font-black text-slate-800 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Edit className="w-5.5 h-5.5 text-blue-950" />
                Cập nhật thông tin Hồ sơ
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inset scrollable body wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 max-h-[calc(90vh-75px)]">
              <form onSubmit={handleEditEmployeeSubmit} className="pl-8 pr-6.5 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white text-slate-800 border rounded-2xl focus:outline-none transition-all duration-150 font-medium ${editErrors.fullname ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-950"
                    }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                {editErrors.fullname && (
                  <p className="text-[10px] text-red-500 font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{editErrors.fullname}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0987654321"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all duration-155 font-medium"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Trạng thái Hồ sơ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium cursor-pointer"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <option value="ACTIVE">Chính thức</option>
                    <option value="PROBATION">Thử việc</option>
                    <option value="RESIGNED">Nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom select: Edit Dept */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Phòng ban trực thuộc
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setEditDeptOpen(!editDeptOpen);
                        setEditPosOpen(false);
                      }}
                      className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium text-left cursor-pointer flex items-center justify-between"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <span>{departments.find(d => d.id === editDeptId)?.name || "Chọn phòng ban"}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${editDeptOpen ? "rotate-180" : ""}`} />
                    </button>

                    {editDeptOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setEditDeptOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 max-h-40 overflow-y-auto">
                          {departments.map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setEditDeptId(d.id);
                                setEditDeptOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${editDeptId === d.id ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom select: Edit Position */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-700 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    Chức danh công việc
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setEditPosOpen(!editPosOpen);
                        setEditDeptOpen(false);
                      }}
                      className="w-full px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-950 transition-all font-medium text-left cursor-pointer flex items-center justify-between"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <span>{positions.find(p => p.id === editPosId)?.name || "Chọn chức danh"}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${editPosOpen ? "rotate-180" : ""}`} />
                    </button>

                    {editPosOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setEditPosOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 z-40 max-h-40 overflow-y-auto">
                          {positions.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setEditPosId(p.id);
                                setEditPosOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors block ${editPosId === p.id ? "bg-blue-950/5 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isEditing ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* POPUP 3: FORM XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN WEB (Click Outside to Close) */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowStatusModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center cursor-default"
            id="account-status-confirm-popup"
          >
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-slate-teal/5 rounded-full blur-xl pointer-events-none" />

            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <ShieldAlert className="w-6 h-6 text-blue-950" />
            </div>

            <h3
              className="text-[15px] font-black text-slate-800 tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {selectedEmployee?.user?.isActive ? "Xác nhận Khóa tài khoản?" : "Mở khóa tài khoản?"}
            </h3>
            <p
              className="text-[11px] text-slate-400 mt-2.5 leading-relaxed"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {selectedEmployee?.user?.isActive
                ? `Bạn có chắc chắn muốn ngắt quyền truy cập của nhân viên ${selectedEmployee?.fullname}? Tài khoản này sẽ không thể đăng nhập vào ứng dụng di động.`
                : `Bạn muốn cấp lại quyền truy cập hệ thống di động cho nhân viên ${selectedEmployee?.fullname}?`}
            </p>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleToggleAccountStatusSubmit}
                className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 4: PHÂN QUYỀN KIÊM NHIỆM (Multiple Department & Role Assignments - Click Outside to Close) */}
      {showRolesModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRolesModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] p-8 max-w-xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left cursor-default max-h-[90vh] overflow-y-auto"
            id="employee-roles-assign-popup"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-5">
              <div className="text-left">
                <h3
                  className="text-base font-black text-slate-800 flex items-center gap-2"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <Shield className="w-5.5 h-5.5 text-blue-950" />
                  Cấu hình Kiêm nhiệm & Phân quyền
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Phân quyền vai trò và phòng ban kiêm nhiệm cho: <strong className="text-slate-700">{selectedEmployee?.fullname}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowRolesModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRolesSubmit} className="space-y-4">

              <div className="space-y-3.5">
                {roleAssignments.map((assignment, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative"
                  >
                    {/* Select Department */}
                    <div className="w-full sm:flex-1 space-y-1 text-left">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Bộ phận</label>
                      <select
                        value={assignment.departmentId}
                        onChange={(e) => handleUpdateAssignmentRow(idx, "departmentId", parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-950 cursor-pointer"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Role */}
                    <div className="w-full sm:flex-1 space-y-1 text-left">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Vai trò hoạt động</label>
                      <select
                        value={assignment.roleId}
                        onChange={(e) => handleUpdateAssignmentRow(idx, "roleId", parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-950 cursor-pointer"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Default */}
                    <div className="w-full sm:w-28 space-y-1 text-left">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Mặc định</label>
                      <select
                        value={assignment.isDefault ? "YES" : "NO"}
                        onChange={(e) => handleUpdateAssignmentRow(idx, "isDefault", e.target.value === "YES")}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-950 cursor-pointer"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        <option value="NO">Không</option>
                        <option value="YES">Có</option>
                      </select>
                    </div>

                    {/* Delete row */}
                    {roleAssignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRoleAssignmentRow(idx)}
                        className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer mt-5 sm:mt-0 shrink-0 self-end sm:self-center"
                        title="Xóa vai trò kiêm nhiệm này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add assignment row button */}
              <button
                type="button"
                onClick={handleAddRoleAssignmentRow}
                className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-blue-950 text-xs font-bold text-slate-600 hover:text-blue-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Plus className="w-4.5 h-4.5" />
                Thêm phòng ban / vai trò kiêm nhiệm
              </button>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 leading-relaxed mt-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                💡 <strong>Quy định cấu hình kiêm nhiệm:</strong> Một nhân viên có thể thuộc nhiều phòng ban với vai trò khác nhau (ví dụ: Nhân sự ở HRD, đồng thời kiêm Kế toán ở Accountant). Nhưng bắt buộc phải chọn duy nhất một liên kết làm <strong>Mặc định (Có)</strong> để hiển thị chính khi đăng nhập.
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRolesModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoles}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isSavingRoles ? "Đang lưu..." : "Lưu phân quyền"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* POPUP 5: FORM THÊM/SỬA PHÒNG BAN (Click Outside to Close) */}
      {showDeptModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeptModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-left cursor-default max-h-[90vh] flex flex-col p-0 overflow-hidden"
            id="department-popup-form"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5 shrink-0">
              <h3
                className="text-lg font-black text-slate-800 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Building className="w-5.5 h-5.5 text-blue-950" />
                {editingDept ? "Chỉnh sửa Phòng ban" : "Thêm mới Phòng ban"}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeptSubmit} className="flex-1 flex flex-col overflow-hidden">
              {settingsError && (
                <div className="mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2.5 text-rose-800 shrink-0">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{settingsError}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar pr-2">
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Tên phòng ban <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      disabled={isSavingDept}
                      placeholder="Ví dụ: Phòng Kỹ thuật"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mã phòng ban <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      disabled={isSavingDept}
                      placeholder="Ví dụ: TECH"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mô tả chi tiết
                    </label>
                    <textarea
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      disabled={isSavingDept}
                      placeholder="Nhập mô tả ngắn về chức năng phòng ban..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs min-h-20 max-h-32"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Phòng ban cha trực thuộc
                    </label>
                    <select
                      value={deptParentId}
                      onChange={(e) => setDeptParentId(e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={isSavingDept}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs cursor-pointer"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <option value="">-- Cấp cao nhất (Không trực thuộc) --</option>
                      {departments
                        .filter(d => !editingDept || d.id !== editingDept.id)
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 px-8 py-5 border-t border-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingDept}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isSavingDept && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSavingDept ? "Đang lưu..." : "Lưu phòng ban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 6: FORM THÊM/SỬA CHỨC DANH (Click Outside to Close) */}
      {showPosModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPosModal(false);
            }
          }}
        >
          <div
            className="bg-white/95 border border-slate-100 rounded-[32px] max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 text-left cursor-default max-h-[90vh] flex flex-col p-0 overflow-hidden"
            id="position-popup-form"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-950/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5 shrink-0">
              <h3
                className="text-lg font-black text-slate-800 flex items-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Layers className="w-5.5 h-5.5 text-blue-950" />
                {editingPos ? "Chỉnh sửa Chức danh" : "Thêm mới Chức danh"}
              </h3>
              <button
                onClick={() => setShowPosModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePosSubmit} className="flex-1 flex flex-col overflow-hidden">
              {settingsError && (
                <div className="mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2.5 text-rose-800 shrink-0">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-650 shrink-0" />
                  <span className="text-xs font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{settingsError}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar pr-2">
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Tên chức danh / Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={posName}
                      onChange={(e) => setPosName(e.target.value)}
                      disabled={isSavingPos}
                      placeholder="Ví dụ: Lập trình viên cao cấp"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-705 block" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Mô tả chi tiết
                    </label>
                    <textarea
                      value={posDesc}
                      onChange={(e) => setPosDesc(e.target.value)}
                      disabled={isSavingPos}
                      placeholder="Mô tả trách nhiệm vị trí công việc..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-950 transition-all font-medium text-slate-700 text-xs min-h-20 max-h-32"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 px-8 py-5 border-t border-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold text-slate-500 transition-all cursor-pointer text-center"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingPos}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {isSavingPos && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSavingPos ? "Đang lưu..." : "Lưu chức danh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
