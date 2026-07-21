package oasis_system.oasis_system.modules.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể ExpenseVoucher đại diện cho Phiếu Chi (Chi lương, Chi mua NVL, Chi phí vận hành, Chi phí dự án).
 */
@Entity
@Table(name = "expense_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "voucher_code", nullable = false, unique = true, length = 50)
    private String voucherCode;

    @Column(nullable = false, length = 50)
    private String category; // PAYROLL, MATERIAL, OPERATION, PROJECT

    @Column(name = "ref_id")
    private Long refId; // Id của Payroll, PurchaseOrder, hoặc Project/ProductionPlan

    @Column(name = "recipient_name", length = 255)
    private String recipientName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private String paymentMethod = "BANK_TRANSFER";

    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
