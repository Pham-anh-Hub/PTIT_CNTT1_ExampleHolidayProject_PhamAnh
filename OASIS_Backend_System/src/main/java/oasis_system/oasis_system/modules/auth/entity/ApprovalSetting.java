package oasis_system.oasis_system.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Thực thể ApprovalSetting đại diện cho cấu hình phê duyệt trong doanh nghiệp (SaaS Tenant).
 */
@Entity
@Table(name = "approval_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "rule_type", nullable = false, length = 100)
    private String ruleType; // ORDER_AMOUNT_THRESHOLD, CONTRACT_APPROVAL, PRODUCTION_PLAN_APPROVAL

    @Column(name = "threshold_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal thresholdValue = BigDecimal.ZERO;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;
}
