package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * CostStructureDto đại diện cho một phần tử trong biểu đồ cơ cấu chi phí (Donut Chart).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostStructureDto {
    private String costName;    // "Chi phí vật tư", "Chi phí lương", "Thuế"
    private BigDecimal amount;  // Số tiền chi phí
    private double percentage;  // Tỷ lệ phần trăm
}
