package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Thực thể Employee ánh xạ tới bảng 'employees' trong Cơ sở dữ liệu.
 * Quản lý hồ sơ chi tiết của nhân viên trong doanh nghiệp.
 */
@Entity
@Table(name = "employees", 
       uniqueConstraints = @UniqueConstraint(name = "unique_emp_code_company", columnNames = {"employee_code", "company_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Tài khoản đăng nhập liên kết (nếu có)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private Position position;

    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode; // Định dạng ví dụ: CTY001-HR-0524

    @Column(nullable = false)
    private String fullname;

    private String email;
    private String phone;
    private LocalDate birthday;
    private String address;

    @Column(name = "cccd_number", length = 20)
    private String cccdNumber;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "Thử việc"; // Các giá trị: Thử việc, Chính thức, Đã nghỉ việc

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
