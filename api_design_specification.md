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

### 2.2. Ghi nhận Công Hàng Ngày Thủ Công cho Khối Sản xuất (WORK_LOG_PRODUCTION)
*   **Endpoint 1 (Nhập công thủ công hàng ngày):** `POST /api/v1/work-logs/production/daily`
*   **Endpoint 2 (Xem nhật ký công hàng ngày trong tháng - Dùng cho Redirect):** `GET /api/v1/work-logs/production/daily?employee_id={id}&period=YYYY-MM`
*   **Nhiệm vụ:** **Khối Sản xuất (Quản lý Phân xưởng / SPM / Trưởng phòng Sản xuất)** chịu trách nhiệm trực tiếp nhập và xác nhận sản lượng công đoạn hàng ngày của công nhân. Ban Kế toán chỉ tiếp nhận kết quả tự động để kiểm tra bảng lương và giải ngân. cho phép xem lại nhật ký công từng ngày trong tháng khi bấm redirect từ Bảng Lương.
*   **Response Data (Danh sách công hàng ngày):** 
    ```json
    [
      {
        "work_date": "2026-06-15",
        "employee_name": "Trần Văn C",
        "product_name": "Bàn gỗ Sồi",
        "stage_name": "Công đoạn Cắt",
        "completed_quantity": 25,
        "unit_price": 30000,
        "amount": 750000
      }
    ]
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

### 2.4. Bảng tính Lương Khối Văn Phòng (PAYROLL_OFFICE)
*   **Endpoint 1 (Lấy bảng lương văn phòng):** `GET /api/v1/payroll/office?period=2026-06`
*   **Endpoint 2 (Cập nhật note OT & Đi muộn):** `PUT /api/v1/payroll/office/{id}/adjustments`
*   **Nhiệm vụ:** Quản lý lương nhân viên văn phòng dựa trên Lương cứng + Phụ cấp + Tiền OT - Phạt đi muộn/khấu trừ.
*   **Response Data:**
    ```json
    [
      {
        "stt": 1,
        "employee_id": 10,
        "employee_code": "CTY001-OFF-001",
        "employee_name": "Nguyễn Văn A",
        "department_name": "Kế toán",
        "base_salary": 15000000,
        "allowance": 1000000,
        "ot_hours": 10.5,
        "ot_amount": 1200000,
        "late_count": 2,
        "late_penalty_amount": 300000,
        "late_note": "Đi muộn 2 lần (30 phút)",
        "other_bonus": 1000000,
        "net_salary": 17900000,
        "status": "Chưa giải quyết" // "Chưa giải quyết" (PENDING) hoặc "Đã giải quyết" (PAID)
      }
    ]
    ```

### 2.5. Bảng tính Lương Khối Sản Xuất Phân Rã Theo Loại Hàng (PAYROLL_PRODUCTION)
*   **Endpoint 1 (Lấy bảng lương sản xuất phân rã):** `GET /api/v1/payroll/production?period=2026-06`
*   **Endpoint 2 (Cập nhật trạng thái giải quyết):** `PUT /api/v1/payroll/production/{id}/resolve`
*   **Nhiệm vụ:** Quản lý lương công nhân sản xuất phân rã từng loại hàng/sản phẩm + số lượng + đơn giá + thành tiền và tổng kết.
*   **Response Data:**
    ```json
    [
      {
        "stt": 1,
        "employee_id": 25,
        "employee_code": "CTY001-PROD-008",
        "employee_name": "Trần Văn C",
        "department_name": "Phân xưởng Mộc",
        "items": [
          {
            "product_type": "Bàn gỗ Sồi (Công đoạn Cắt)",
            "quantity": 150,
            "unit_price": 30000,
            "amount": 4500000
          },
          {
            "product_type": "Ghế gỗ Sồi (Công đoạn Lắp ráp)",
            "quantity": 80,
            "unit_price": 50000,
            "amount": 4000000
          },
          {
            "product_type": "Tủ áo 3 cánh (Công đoạn Sơn PU)",
            "quantity": 20,
            "unit_price": 150000,
            "amount": 3000000
          }
        ],
        "total_quantity": 250,
        "total_amount": 11500000,
        "status": "Chưa giải quyết", // "Chưa giải quyết" (PENDING) hoặc "Đã giải quyết" (PAID)
        "detail_redirect_url": "/work-logs/production/daily?employee_id=25&period=2026-06"
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

## 6. Nhóm Kế toán (Accounting Module)

### 6.1. Lập Phiếu Thu
*   **Endpoint:** `POST /api/v1/accounting/receipts`
*   **Nhiệm vụ:** Lập phiếu thu đợt cho đơn hàng hoặc thu hồi công nợ khách hàng.

### 6.2. Lập Phiếu Chi
*   **Endpoint:** `POST /api/v1/accounting/expenses`
*   **Nhiệm vụ:** Lập phiếu chi cho chi trả lương, mua NVL, chi phí vận hành/dự án.

### 6.3. Thống kê Dòng tiền (Thu/Chi)
*   **Endpoint:** `GET /api/v1/accounting/receipts/cash-flow/summary?period=YYYY-MM`
*   **Nhiệm vụ:** Tổng hợp tổng thu, tổng chi và dòng tiền ròng thực tế.

### 6.4. Công nợ Khách hàng
*   **Endpoint:** `GET /api/v1/accounting/debts/customers`
*   **Nhiệm vụ:** Danh sách công nợ phải thu của khách hàng theo đợt đơn hàng.

### 6.5. Lịch sử đợt thanh toán của đơn hàng
*   **Endpoint:** `GET /api/v1/accounting/debts/orders/{orderId}/payment-schedule`
*   **Nhiệm vụ:** Trả về các đợt đã thanh toán và số tiền còn nợ.

### 6.6. Đối soát & Tổng hợp Bảng lương
*   **Endpoint:** `POST /api/v1/accounting/payroll/aggregate?period=YYYY-MM`
*   **Nhiệm vụ:** Tự động đối soát giờ công HR và sản lượng công đoạn Sản xuất để tính bảng lương.

### 6.7. Giải ngân Lương
*   **Endpoint:** `POST /api/v1/accounting/payroll/{payrollId}/disburse`
*   **Nhiệm vụ:** Chốt duyệt và lập phiếu chi trả lương nhân viên.

### 6.8. Ngân sách Dự án
*   **Endpoint:** `GET /api/v1/accounting/projects/{projectId}/budget-status`
*   **Nhiệm vụ:** Xem hạn mức ngân sách (`allocated_budget`) vs Chi phí thực tế (`actual_spent`).

### 6.9. Lợi nhuận Gộp Dự án
*   **Endpoint:** `GET /api/v1/accounting/projects/{projectId}/profitability`
*   **Nhiệm vụ:** Thống kê Doanh thu thực thu - Chi phí thực tế và Tỷ suất lợi nhuận gộp.

### 6.10. Báo cáo Thuế Thực tế
*   **Endpoint:** `GET /api/v1/accounting/reports/tax/summary?period=YYYY-MM`
*   **Nhiệm vụ:** Thống kê Thuế Gia công sản xuất, Thuế Thu nhập và Thuế GTGT (VAT).

