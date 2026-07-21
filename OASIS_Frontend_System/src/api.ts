export const API_BASE_URL = "http://localhost:8080";

// Ghi đè fetch toàn cục để bắt lỗi 401 Unauthorized (hết hạn token)
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const res = await originalFetch(input, init);
  if (res.status === 401) {
    const urlString = typeof input === "string" 
      ? input 
      : (input instanceof Request ? input.url : input.toString());
    
    // Bỏ qua các API phục vụ đăng nhập
    if (!urlString.includes("/api/v1/auth/login") && !urlString.includes("/api/v1/auth/select-context")) {
      window.dispatchEvent(new CustomEvent("session-expired"));
    }
  }
  return res;
};

export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("saas_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Đăng nhập thất bại");
  }
  return json;
}

export async function selectContextApi(email: string, roleId: number, departmentId: number | null) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/select-context`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, roleId, departmentId }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lựa chọn ngữ cảnh thất bại");
  }
  return json;
}

export async function registerCompanyApi(dto: {
  companyName: string;
  companyCode: string;
  adminEmail: string;
  adminFullname: string;
  adminPassword: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys_admin/register-company`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể đăng ký doanh nghiệp");
  }
  return json;
}

export async function logoutApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
    });
    // ignore error if request fails
  } catch (e) {
    console.error("Lỗi khi gọi API đăng xuất:", e);
  } finally {
    localStorage.removeItem("saas_user");
    localStorage.removeItem("saas_token");
  }
}

export async function getCompaniesApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys_admin/companies`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy danh sách doanh nghiệp");
  }
  return json;
}

export async function getCompanyDetailApi(id: number | string) {
  const cleanId = typeof id === "string" ? id.replace("tenant-", "") : id;
  const res = await fetch(`${API_BASE_URL}/api/v1/sys_admin/companies/${cleanId}`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy chi tiết doanh nghiệp");
  }
  return json;
}

export async function updateCompanyApi(id: number | string, dto: {
  name: string;
  address: string;
  phone: string;
  email: string;
  subscriptionPlan: string;
}) {
  const cleanId = typeof id === "string" ? id.replace("tenant-", "") : id;
  const res = await fetch(`${API_BASE_URL}/api/v1/sys_admin/companies/${cleanId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật thông tin doanh nghiệp");
  }
  return json;
}

export async function updateCompanyStatusApi(id: number | string, isActive: boolean) {
  const cleanId = typeof id === "string" ? id.replace("tenant-", "") : id;
  const res = await fetch(`${API_BASE_URL}/api/v1/sys_admin/companies/${cleanId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ isActive }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể thay đổi trạng thái doanh nghiệp");
  }
  return json;
}

export async function getTenantEmployeesApi(search?: string, departmentId?: number | string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (departmentId) params.append("departmentId", departmentId.toString());
  if (status) params.append("status", status);

  const res = await fetch(`${API_BASE_URL}/api/v1/sys/employees?${params.toString()}`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy danh sách nhân viên");
  }
  return json;
}

export async function createTenantEmployeeApi(dto: {
  fullname: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  departmentId: number;
  positionId: number;
  roleId: number;
  status: string;
  createAccount: boolean;
  password?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể thêm nhân viên mới");
  }
  return json;
}

export async function updateTenantEmployeeApi(id: number | string, dto: {
  fullname: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
  departmentId: number;
  positionId: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật hồ sơ nhân viên");
  }
  return json;
}

export async function updateEmployeeAccountStatusApi(id: number | string, isActive: boolean) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/employees/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ isActive }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể đổi trạng thái tài khoản nhân viên");
  }
  return json;
}

export async function assignEmployeeRolesApi(id: number | string, assignments: Array<{
  departmentId: number;
  roleId: number;
  isDefault: boolean;
}>) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/employees/${id}/roles`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(assignments),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật phân quyền kiêm nhiệm");
  }
  return json;
}

export async function getTenantDepartmentsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/departments`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể tải danh sách phòng ban");
  }
  return json;
}

export async function getTenantPositionsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/positions`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể tải danh sách chức danh");
  }
  return json;
}

export async function getTenantRolesApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/roles`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể tải danh sách vai trò");
  }
  return json;
}

export async function getTenantCompanyProfileApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/company`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy thông tin doanh nghiệp");
  }
  return json;
}

export async function updateTenantCompanyProfileApi(dto: {
  name: string;
  address: string;
  phone: string;
  email: string;
  subscriptionPlan: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/company`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật thông tin doanh nghiệp");
  }
  return json;
}

export async function getTenantApprovalSettingsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/approval-settings`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy cấu hình phê duyệt");
  }
  return json;
}

export async function updateTenantApprovalSettingsApi(dtos: Array<{
  id?: number | null;
  ruleType: string;
  thresholdValue: number;
  isEnabled: boolean;
}>) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/approval-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dtos),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật cấu hình phê duyệt");
  }
  return json;
}

export async function createTenantDepartmentApi(dto: {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: number | null;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/departments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể tạo phòng ban");
  }
  return json;
}

export async function updateTenantDepartmentApi(id: number, dto: {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: number | null;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/departments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật phòng ban");
  }
  return json;
}

export async function deleteTenantDepartmentApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/departments/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể xóa phòng ban");
  }
  return json;
}

export async function createTenantPositionApi(dto: {
  name: string;
  description?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể tạo chức danh");
  }
  return json;
}

export async function updateTenantPositionApi(id: number, dto: {
  name: string;
  description?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/positions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(dto),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể cập nhật chức danh");
  }
  return json;
}

export async function deleteTenantPositionApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/sys/positions/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể xóa chức danh");
  }
  return json;
}

// ==================== BOD DASHBOARD & REAL-TIME NOTIFICATIONS ====================

export async function getBodKpiCardsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/kpi-cards`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy thông tin thẻ KPI");
  }
  return json;
}

export async function getBodRevenueTrendApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/charts/revenue-trend`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy biểu đồ xu hướng doanh thu");
  }
  return json;
}

export async function getBodCostStructureApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/charts/cost-structure`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy biểu đồ cơ cấu chi phí");
  }
  return json;
}

export async function getBodCustomerDebtApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/charts/customer-debt`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy biểu đồ công nợ khách hàng");
  }
  return json;
}

export async function simulateBodNotificationApi(payload: {
  title: string;
  message: string;
  type: string;
  referenceId?: number;
  targetRole?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/simulate-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Mô phỏng gửi thông báo thất bại");
  }
  return json;
}

export async function getBodNotificationsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/notifications`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể lấy danh sách thông báo");
  }
  return json;
}

export async function getBodNotificationsUnreadCountApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/notifications/unread-count`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể đếm thông báo chưa đọc");
  }
  return json;
}

export async function markBodNotificationReadApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/notifications/${id}/read`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể đánh dấu đã đọc");
  }
  return json;
}

export async function markAllBodNotificationsReadApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/dashboard/notifications/read-all`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Không thể đánh dấu đã đọc tất cả");
  }
  return json;
}

// ==========================================
// API DÀNH CHO BOD HRM (GIÁM ĐỐC)
// ==========================================

export async function getBodPendingContractsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/contracts/pending`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function approveBodContractApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/contracts/${id}/approve`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function rejectBodContractApi(id: number, reason: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/contracts/${id}/reject`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function getBodPayrollsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/payrolls`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function approveBodPayrollApi(period: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/payrolls/${period}/approve`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function payBodPayrollApi(period: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/payrolls/${period}/pay`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodHrmAnalyticsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/analytics`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodPendingLeavesApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/leaves/pending`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function approveBodLeaveApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/leaves/${id}/approve`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function rejectBodLeaveApi(id: number, reason: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/leaves/${id}/reject`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function getBodApprovalLogsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/hrm/approval-logs`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

// ==========================================
// API DÀNH CHO BOD SALES (GIÁM ĐỐC)
// ==========================================

export async function getBodPendingOrdersApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/orders/pending`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function approveBodOrderApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/orders/${id}/approve`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function rejectBodOrderApi(id: number, reason: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/orders/${id}/reject`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function getBodDebtAgingReportApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/reports/debt-aging`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodRevenueCashflowApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/reports/revenue-cashflow`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodTopCustomersApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/sales/reports/top-customers`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

// ─── BOD Finance & Accounting APIs ───────────────────────────────────────────
export async function getBodPendingPayrollsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/finance/payrolls/pending`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodPayrollAnalysisApi(period: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/finance/payrolls/${encodeURIComponent(period)}/analysis`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function authorizeBodPayrollApi(period: string, note?: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/finance/payrolls/${encodeURIComponent(period)}/authorize`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note: note || "" }),
  });
  return res.json();
}

export async function getBodFinancialHealthRadarApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/finance/health-radar`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

// ─── BOD Production & Operations Module APIs ──────────────────────────────────
export async function getBodPendingProductionPlansApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/production/plans/pending`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function approveBodProductionPlanApi(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/production/plans/${id}/approve`, {
    method: "PUT",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function rejectBodProductionPlanApi(id: number, reason: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/production/plans/${id}/reject`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function getBodProductionProgressApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/production/progress`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodProductionBottlenecksApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/production/bottlenecks`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

// ─── BOD Settings & Audit Module APIs ─────────────────────────────────────────
export async function getBodAuditLogsApi(params?: { module?: string; severity?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.module && params.module !== 'ALL') query.append('module', params.module);
  if (params?.severity && params.severity !== 'ALL') query.append('severity', params.severity);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE_URL}/api/v1/bod/settings/audit-logs?${query.toString()}`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function getBodThresholdsApi() {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/settings/thresholds`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function updateBodThresholdsApi(dto: any) {
  const res = await fetch(`${API_BASE_URL}/api/v1/bod/settings/thresholds`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  return res.json();
}
