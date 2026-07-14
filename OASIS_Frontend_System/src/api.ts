export const API_BASE_URL = "http://localhost:8080";

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
