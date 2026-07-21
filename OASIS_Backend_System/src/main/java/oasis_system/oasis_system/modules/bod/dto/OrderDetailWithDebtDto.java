package oasis_system.oasis_system.modules.bod.dto;

import lombok.*;
import oasis_system.oasis_system.modules.crm.entity.Order;
import oasis_system.oasis_system.modules.crm.entity.OrderDetail;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO chứa thông tin chi tiết một đơn hàng, các dòng mặt hàng cùng hồ sơ nợ hiện tại của khách hàng.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetailWithDebtDto {
    private Order order;                        // Thông tin đơn hàng chung
    private List<OrderDetail> orderDetails;     // Các dòng sản phẩm chi tiết
    private BigDecimal customerTotalDebt;       // Tổng dư nợ hiện tại của khách hàng
    private double maxDiscountPercent;          // Tỷ lệ chiết khấu cao nhất phát hiện trong đơn hàng (%)
}
