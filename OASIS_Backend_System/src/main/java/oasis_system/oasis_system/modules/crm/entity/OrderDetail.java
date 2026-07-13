package oasis_system.oasis_system.modules.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.production.entity.Product;

import java.math.BigDecimal;

/**
 * Thực thể OrderDetail ánh xạ tới bảng 'order_details' trong Cơ sở dữ liệu.
 * Chi tiết các dòng hàng sản phẩm, số lượng, đơn giá và thành tiền trong đơn đặt hàng.
 */
@Entity
@Table(name = "order_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal; // Thành tiền (quantity * unitPrice)
}
