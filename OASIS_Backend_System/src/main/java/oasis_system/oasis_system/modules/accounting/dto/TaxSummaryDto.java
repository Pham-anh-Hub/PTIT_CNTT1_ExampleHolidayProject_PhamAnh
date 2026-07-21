package oasis_system.oasis_system.modules.accounting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxSummaryDto {
    private String period;
    private BigDecimal manufacturingOutsourcingTax; // Thuế gia công sản xuất
    private BigDecimal incomeTaxEstimated; // Thuế thu nhập (TNDN + TNCN)
    private BigDecimal vatOutbound; // Thuế GTGT đầu ra
    private BigDecimal vatInbound; // Thuế GTGT đầu vào
    private BigDecimal vatNetPayable; // Thuế GTGT còn phải nộp
}
