# Tài liệu Phân tích & Thiết kế API (API Design Specification)

Dựa trên tài liệu đặc tả `srs_framework.md` và dưới góc nhìn của một Senior Project Manager & System Analyst, để team Frontend có thể chủ động dựng giao diện và ghép nối mượt mà với Backend, tôi đã phân tích và thiết kế danh sách các API cốt lõi. 

Các API được thiết kế theo chuẩn **RESTful**, định dạng dữ liệu trả về chuẩn hóa (JSON), và luôn đi kèm HTTP Status Code rõ ràng. Cấu trúc Response chung cho mọi API sẽ có dạng:
```json
{
  "code": 200, // HTTP Status
  "message": "Success", // Thông báo
  "data": { ... } // Dữ liệu trả về cho Frontend
}
```

Dưới đây là danh sách các Endpoint và Dữ liệu trả về (phần `data`) phân bổ theo từng Module nghiệp vụ:

---

## 1. Nhóm Xác thực & Ngữ cảnh (Authentication - Module AUTH)

### 1.1. Đăng nhập hệ thống
*   **Endpoint:** `POST /api/v1/auth/login`
*   **Nhiệm vụ:** Kiểm tra email/password. Xử lý logic 1 vai trò hoặc nhiều vai trò kiêm nhiệm (Như mô tả phần 2.2 SRS).
*   **Response Data (TH 1: Chỉ có 1 vai trò - Trả token luôn):**
    ```json
    {
      "require_context_selection": false,
      "access_token": "eyJhbGciOiJIUzI1...",
      "user_info": { "id": 1, "fullname": "Nguyễn Văn A", "avatar": "..." }
    }
    ```
*   **Response Data (TH 2: Kiêm nhiệm nhiều phòng/vai trò - Yêu cầu chọn ngữ cảnh):**
    ```json
    {
      "require_context_selection": true,
      "contexts": [
        { "role_id": 2, "role_name": "Trưởng phòng", "department_id": 1, "department_name": "Kinh doanh" },
        { "role_id": 3, "role_name": "Nhân viên", "department_id": 2, "department_name": "Sản xuất" }
      ]
    }
    ```

### 1.2. Chọn ngữ cảnh (Đối với TH2 ở trên)
*   **Endpoint:** `POST /api/v1/auth/select-context`
*   **Nhiệm vụ:** User chọn 1 ngữ cảnh và gửi `role_id`, `department_id` lên để nhận Token chính thức.
*   **Response Data:** Trả về `access_token` chứa thông tin ngữ cảnh đã chọn.

---

## 2. Nhóm Quản lý Nhân sự & Lương (HRM)

### 2.1. Danh sách Nhân viên (Dành cho HR - UC1)
*   **Endpoint:** `GET /api/v1/hrm/employees`
*   **Nhiệm vụ:** Lấy danh sách hồ sơ nhân sự (có phân trang và tìm kiếm).
*   **Response Data:**
    ```json
    {
      "content": [
        {
          "id": 15,
          "employee_code": "CTY001-SALE-0023",
          "fullname": "Trần Thị B",
          "department_name": "Kinh doanh",
          "position_name": "Chuyên viên",
          "status": "Chính thức"
        }
      ],
      "total_elements": 45,
      "total_pages": 3
    }
    ```

### 2.2. Chấm công hàng ngày (Dành cho Nhân viên - UC4)
*   **Endpoint:** `POST /api/v1/hrm/attendance/check-in` (hoặc `check-out`)
*   **Nhiệm vụ:** Ghi nhận giờ vào/ra ca.
*   **Response Data:** 
    ```json
    {
      "work_date": "2026-07-10",
      "check_in_time": "08:02:15",
      "status": "Ghi nhận thành công"
    }
    ```

### 2.3. Quản lý Yêu cầu Nghỉ phép (UC5, UC6)
*   **Endpoint (NV gửi đơn):** `POST /api/v1/hrm/leave-requests`
*   **Endpoint (Trưởng phòng lấy ds chờ duyệt):** `GET /api/v1/hrm/leave-requests/pending`
*   **Endpoint (Trưởng phòng duyệt/từ chối):** `PUT /api/v1/hrm/leave-requests/{id}/approve`
*   **Response Data (Danh sách chờ duyệt):**
    ```json
    [
      {
        "id": 102,
        "employee_name": "Lê Văn C",
        "leave_type": "Phép năm",
        "start_date": "2026-07-12",
        "end_date": "2026-07-13",
        "reason": "Về quê",
        "status": "Chờ duyệt"
      }
    ]
    ```

### 2.4. Bảng tính lương (UC3)
*   **Endpoint:** `GET /api/v1/hrm/payrolls?period=2026-06`
*   **Nhiệm vụ:** Lấy danh sách lương tổng hợp tháng để HR xuất Excel.
*   **Response Data:**
    ```json
    [
      {
        "employee_code": "...",
        "fullname": "...",
        "base_component": 15000000,
        "production_component": 0,
        "total_amount": 13500000,
        "status": "finalized"
      }
    ]
    ```

---

## 3. Nhóm Vận hành (Kinh doanh & Sản xuất - OPS)

### 3.1. Tạo Đơn hàng (Kinh doanh - UC8)
*   **Endpoint:** `POST /api/v1/ops/orders`
*   **Nhiệm vụ:** Kinh doanh lên đơn, Backend tự động tính toán tổng tiền và so sánh với `ApprovalSettings` để quyết định trạng thái là `Đã duyệt` hay `Chờ duyệt`.
*   **Response Data:**
    ```json
    {
      "order_id": 456,
      "total_amount": 55000000,
      "approval_status": "Chờ duyệt",
      "message": "Đơn hàng vượt ngưỡng, đã gửi yêu cầu duyệt tới Giám đốc."
    }
    ```

### 3.2. Cấu hình Định mức BOM (Sản xuất - UC9)
*   **Endpoint:** `POST /api/v1/ops/products/{product_id}/bom`
*   **Nhiệm vụ:** Lưu công thức nguyên vật liệu cho 1 sản phẩm.

### 3.3. Lập Kế hoạch & Dự toán Sản xuất (Sản xuất - UC10)
*   **Endpoint:** `POST /api/v1/ops/production-plans`
*   **Nhiệm vụ:** Tạo kế hoạch. Backend tự động tính vật tư dựa trên BOM và check tồn kho (Inventory).
*   **Response Data:**
    ```json
    {
      "plan_id": 78,
      "estimated_budget": 120000000,
      "missing_materials": [
        { "material_name": "Thép cuộn", "shortage_quantity": 50 }
      ],
      "approval_status": "Chờ duyệt"
    }
    ```

---

## 4. Nhóm Phê duyệt & Giám đốc (BOD)

### 4.1. Hộp thư phê duyệt tập trung (UC11)
*   **Endpoint:** `GET /api/v1/bod/approvals/pending`
*   **Nhiệm vụ:** Trả về tất cả những gì đang chờ Giám đốc duyệt (Hợp đồng, Đơn hàng, Kế hoạch SX).
*   **Response Data:**
    ```json
    {
      "orders": [ { "id": 456, "total_amount": 55000000, "customer": "..." } ],
      "contracts": [ { "id": 12, "employee": "...", "base_salary": 15000000 } ],
      "production_plans": [ { "id": 78, "product": "...", "budget": 120000000 } ]
    }
    ```

### 4.2. Thống kê Dashboard (UC12)
*   **Endpoint:** `GET /api/v1/bod/dashboard/metrics`
*   **Nhiệm vụ:** Cung cấp số liệu để Frontend vẽ biểu đồ (Chart.js / Recharts).
*   **Response Data:**
    ```json
    {
      "total_revenue_month": 450000000,
      "total_debt": 120000000,
      "production_vs_sales": {
        "produced": 1500,
        "sold": 1200
      }
    }
    ```

---

## 5. Nhóm Quản trị Hệ thống (Admin/Super Admin)

### 5.1. Thiết lập Cấu hình Phê duyệt (Admin DN - UC14)
*   **Endpoint:** `PUT /api/v1/sys/settings/approvals`
*   **Nhiệm vụ:** Bật/tắt hoặc đổi hạn mức tiền (Ví dụ: Đổi ngưỡng duyệt đơn hàng từ 50tr xuống 20tr).
*   **Response Data:**
    ```json
    {
      "rule_type": "ORDER_AMOUNT_THRESHOLD",
      "threshold_value": 20000000,
      "is_enabled": true
    }
    ```
