package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO chứa thông tin tóm tắt danh mục khách hàng dưới góc độ tài chính kinh doanh.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerSummaryDto {
    private Long id;
    private String code;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String type;                  // cá nhân, doanh nghiệp
    private long totalOrdersCount;        // Số đơn hàng đã chốt
    private BigDecimal totalOrderedAmount; // Tổng giá trị đơn mua hàng tích lũy
    private BigDecimal currentDebt;       // Số tiền nợ hiện tại
}
