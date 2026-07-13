package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Thực thể Contract ánh xạ tới bảng 'contracts' trong Cơ sở dữ liệu.
 * Quản lý thông tin hợp đồng lao động của nhân viên trong doanh nghiệp,
 * hỗ trợ quy trình duyệt hợp đồng bởi Ban Giám đốc/Chủ doanh nghiệp.
 */
@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "contract_type", nullable = false, length = 50)
    private String contractType; // PROBATION, FIXED_TERM, INDEFINITE

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "base_salary", nullable = false)
    private BigDecimal baseSalary;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "version_no", nullable = false)
    @Builder.Default
    private Integer versionNo = 1;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "active"; // active, expired, terminated

    @Column(name = "approval_status", nullable = false, length = 50)
    @Builder.Default
    private String approvalStatus = "Chờ duyệt"; // Chờ duyệt, Đã phê duyệt, Bị từ chối

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy; // Người phê duyệt (Giám đốc/Chủ doanh nghiệp - trỏ tới bảng employees)

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
