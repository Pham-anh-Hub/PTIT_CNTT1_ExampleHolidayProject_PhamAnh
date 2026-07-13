-- =======================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU SAAS ERP - MYSQL 8.0+
-- Tác giả: AI Assistant (Senior Data Analyst/Architect)
-- Mô hình: Shared-Database, Shared-Schema (Tenant ID)
-- =======================================================

-- CREATE DATABASE oasis_system_database;
USE oasis_system_database;

SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================
-- NHÓM 1: MULTI-TENANT & TÀI KHOẢN ĐĂNG NHẬP
-- =======================================================

-- 1. Bảng companies (Doanh nghiệp - Tenant)
CREATE TABLE companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (code)
);

-- 2. Bảng users (Tài khoản đăng nhập)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NULL,
    birthday DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email),
    INDEX idx_company_id (company_id),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 3. Bảng roles (Vai trò phân quyền)
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 5. Bảng approval_settings (Ngưỡng duyệt)
CREATE TABLE approval_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_approval_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- =======================================================
-- NHÓM 2: TỔ CHỨC & HỒ SƠ NHÂN SỰ
-- =======================================================

-- 6. Bảng departments (Phòng ban)
CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    parent_department_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_dept_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. Bảng user_role_departments (Liên kết Vai trò - Phòng ban)
CREATE TABLE user_role_departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    department_id BIGINT UNSIGNED NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY unique_user_role_dept (user_id, role_id, department_id),
    CONSTRAINT fk_urd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_urd_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_urd_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 7. Bảng positions (Chức vụ)
CREATE TABLE positions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT fk_positions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 8. Bảng employees (Hồ sơ Nhân viên)
CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    position_id BIGINT UNSIGNED NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    birthday DATE NULL,
    address VARCHAR(255) NULL,
    cccd_number VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Thử việc',
    hire_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_emp_code_company (employee_code, company_id),
    CONSTRAINT fk_emp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_emp_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT
);

-- 9. Bảng contracts (Hợp đồng lao động)
CREATE TABLE contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    base_salary DECIMAL(15,2) NOT NULL,
    file_url VARCHAR(500) NULL,
    version_no INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Chờ duyệt',
    approved_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contract_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_contract_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- =======================================================
-- NHÓM 3: CA KÍP, CHẤM CÔNG & NGHỈ PHÉP
-- =======================================================

-- 10. Bảng shifts (Ca làm việc)
CREATE TABLE shifts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT fk_shifts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 11. Bảng attendances (Nhật ký chấm công)
CREATE TABLE attendances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    shift_id BIGINT UNSIGNED NOT NULL,
    work_date DATE NOT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    note VARCHAR(255) NULL,
    UNIQUE KEY unique_attendance_emp_date_shift (employee_id, work_date, shift_id),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- 12. Bảng leave_requests (Yêu cầu nghỉ phép)
CREATE TABLE leave_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Chờ duyệt',
    approver_id BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_approver FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- =======================================================
-- NHÓM 4: BẢNG LƯƠNG & NHẬT KÝ SẢN XUẤT
-- =======================================================

-- 13. Bảng payrolls (Bảng lương tháng)
CREATE TABLE payrolls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT UNSIGNED NOT NULL,
    period VARCHAR(7) NOT NULL,
    base_component DECIMAL(15,2) NULL DEFAULT 0.00,
    production_component DECIMAL(15,2) NULL DEFAULT 0.00,
    allowance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    overtime_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deduction_bhxh DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deduction_tax DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deduction_advance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_payroll_emp_period (employee_id, period),
    CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =======================================================
-- NHÓM 5: SẢN PHẨM & KHO HÀNG
-- =======================================================

-- 15. Bảng products (Sản phẩm thành phẩm)
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    sale_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    UNIQUE KEY unique_product_code_company (code, company_id),
    CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 16. Bảng materials (Nguyên vật liệu)
CREATE TABLE materials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_stock_threshold DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY unique_material_code_company (code, company_id),
    CONSTRAINT fk_material_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 17. Bảng boms (Định mức nguyên vật liệu)
CREATE TABLE boms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    material_id BIGINT UNSIGNED NOT NULL,
    quantity_required DECIMAL(12,4) NOT NULL,
    UNIQUE KEY unique_bom_product_material (product_id, material_id),
    CONSTRAINT fk_bom_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_bom_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
);

-- 18. Bảng inventories (Kho hàng thực tế)
CREATE TABLE inventories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_inventory_company_item (company_id, item_type, item_id),
    CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- =======================================================
-- NHÓM 7: KHÁCH HÀNG, ĐƠN HÀNG & CÔNG NỢ (Tạo trước vì Sản xuất phụ thuộc)
-- =======================================================

-- 21. Bảng customers (Khách hàng)
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address VARCHAR(500) NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'cá nhân',
    UNIQUE KEY unique_customer_code_company (code, company_id),
    CONSTRAINT fk_customer_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 22. Bảng orders (Đơn đặt hàng)
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(100) NOT NULL DEFAULT 'Mới tạo',
    total_amount DECIMAL(15,2) NOT NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Chờ duyệt',
    approved_by BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    CONSTRAINT fk_order_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_creator FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE RESTRICT
);

-- 23. Bảng order_details (Chi tiết đơn hàng)
CREATE TABLE order_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_order_detail_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_detail_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 24. Bảng payments (Lịch sử thanh toán công nợ)
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    note VARCHAR(255) NULL,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =======================================================
-- NHÓM 6: KẾ HOẠCH & CÔNG ĐOẠN SẢN XUẤT
-- =======================================================

-- 19. Bảng production_plans (Kế hoạch sản xuất)
CREATE TABLE production_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    planned_quantity DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Chờ duyệt',
    approved_by BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    estimated_budget DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_plan_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_plan_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_plan_creator FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE RESTRICT
);

-- 20. Bảng production_stages (Công đoạn sản xuất chi tiết)
CREATE TABLE production_stages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    production_plan_id BIGINT UNSIGNED NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    sequence_no INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    assignee_id BIGINT UNSIGNED NULL,
    pay_type VARCHAR(50) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    CONSTRAINT fk_stage_plan FOREIGN KEY (production_plan_id) REFERENCES production_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_stage_assignee FOREIGN KEY (assignee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- 14. Bảng production_stage_work_logs (Nhật ký công sản xuất - Bổ sung vào Nhóm 4)
CREATE TABLE production_stage_work_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    production_stage_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(6,2) NULL,
    quantity_completed DECIMAL(12,2) NULL,
    computed_amount DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_worklog_stage FOREIGN KEY (production_stage_id) REFERENCES production_stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_worklog_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 25. Bảng recruitment_posts (Nhật ký tin tuyển dụng đã đăng bên ngoài - Bổ sung vào Nhóm 2)
CREATE TABLE recruitment_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NULL,
    external_url VARCHAR(500) NULL,
    platform VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Đã đăng',
    posted_at DATETIME NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recruitment_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_recruitment_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

SET FOREIGN_KEY_CHECKS = 1;
