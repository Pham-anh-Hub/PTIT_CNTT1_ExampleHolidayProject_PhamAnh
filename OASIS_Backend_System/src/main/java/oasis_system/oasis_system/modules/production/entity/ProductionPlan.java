package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.hrm.entity.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Thực thể ProductionPlan ánh xạ tới bảng 'production_plans' trong Cơ sở dữ liệu.
 * Lập kế hoạch sản xuất thành phẩm theo đơn đặt hàng bán ra hoặc kế hoạch tích lũy tồn kho.
 */
@Entity
@Table(name = "production_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order; // Liên kết đơn hàng (nếu có), có thể null nếu sản xuất lưu kho

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "planned_quantity", nullable = false)
    private BigDecimal plannedQuantity;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, IN_PROGRESS, DONE, CANCELLED

    @Column(name = "approval_status", nullable = false, length = 50)
    @Builder.Default
    private String approvalStatus = "Chờ duyệt"; // Chờ duyệt, Đã phê duyệt, Bị từ chối

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy; // Người phê duyệt (Chủ DN/Giám đốc - trỏ tới bảng employees)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Employee createdBy; // Người lập kế hoạch (Trưởng phòng SX - trỏ tới bảng employees)

    @Column(name = "estimated_budget", nullable = false)
    @Builder.Default
    private BigDecimal estimatedBudget = BigDecimal.ZERO; // Dự toán ngân sách sản xuất

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
