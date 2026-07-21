package oasis_system.oasis_system.modules.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể ProjectBudget đại diện cho Ngân sách & Hạn mức chi phí của Dự án / Kế hoạch sản xuất.
 */
@Entity
@Table(name = "project_budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "project_id", nullable = false)
    private Long projectId; // ID kế hoạch sản xuất / dự án

    @Column(name = "allocated_budget", nullable = false, precision = 15, scale = 2)
    private BigDecimal allocatedBudget;

    @Column(name = "actual_spent", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal actualSpent = BigDecimal.ZERO;

    @Column(name = "actual_material_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal actualMaterialCost = BigDecimal.ZERO;

    @Column(name = "actual_labor_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal actualLaborCost = BigDecimal.ZERO;

    @Column(name = "actual_other_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal actualOtherCost = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
