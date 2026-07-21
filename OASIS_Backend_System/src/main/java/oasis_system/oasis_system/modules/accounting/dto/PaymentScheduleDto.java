package oasis_system.oasis_system.modules.accounting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentScheduleDto {
    private Long orderId;
    private BigDecimal orderTotalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingDebt;
    private java.util.List<PaymentItem> payments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentItem {
        private String voucherCode;
        private BigDecimal amount;
        private String paymentMethod;
        private LocalDateTime paidDate;
        private String note;
    }
}
