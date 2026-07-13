package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

import java.math.BigDecimal;

/**
 * Thực thể Product ánh xạ tới bảng 'products' trong Cơ sở dữ liệu.
 * Quản lý danh mục sản phẩm thành phẩm sản xuất và bán hàng.
 */
@Entity
@Table(name = "products", 
       uniqueConstraints = @UniqueConstraint(name = "unique_product_code_company", columnNames = {"code", "company_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String unit; // Đơn vị tính (ví dụ: cái, hộp, kg)

    @Column(name = "sale_price", nullable = false)
    @Builder.Default
    private BigDecimal salePrice = BigDecimal.ZERO;

    @Column(length = 100)
    private String category;

    private String description;
}
