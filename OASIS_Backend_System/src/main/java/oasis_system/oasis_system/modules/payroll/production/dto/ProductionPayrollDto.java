package oasis_system.oasis_system.modules.payroll.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionPayrollDto {
    private Integer stt;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private List<PayrollItem> items;
    private Integer totalQuantity;
    private BigDecimal totalAmount;
    private String status; // Chưa giải quyết, Đã giải quyết
    private String detailRedirectUrl;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayrollItem {
        private String productType;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal amount;
    }
}
