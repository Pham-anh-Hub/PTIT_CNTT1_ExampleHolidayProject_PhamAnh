package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể Payroll ánh xạ tới bảng 'payrolls' trong Cơ sở dữ liệu.
 * Ghi nhận bảng lương tổng hợp cuối tháng của từng nhân viên (lương cơ bản, lương công đoạn sản xuất, phụ cấp, giảm trừ và thực lĩnh).
 */
@Entity
@Table(name = "payrolls", 
       uniqueConstraints = @UniqueConstraint(name = "unique_payroll_emp_period", columnNames = {"employee_id", "period"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, length = 7)
    private String period; // Định dạng YYYY-MM

    @Column(name = "base_component")
    @Builder.Default
    private BigDecimal baseComponent = BigDecimal.ZERO;

    @Column(name = "production_component")
    @Builder.Default
    private BigDecimal productionComponent = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal allowance = BigDecimal.ZERO;

    @Column(name = "overtime_amount", nullable = false)
    @Builder.Default
    private BigDecimal overtimeAmount = BigDecimal.ZERO;

    @Column(name = "deduction_bhxh", nullable = false)
    @Builder.Default
    private BigDecimal deductionBhxh = BigDecimal.ZERO;

    @Column(name = "deduction_tax", nullable = false)
    @Builder.Default
    private BigDecimal deductionTax = BigDecimal.ZERO;

    @Column(name = "deduction_advance", nullable = false)
    @Builder.Default
    private BigDecimal deductionAdvance = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "draft"; // draft, approved, paid

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
