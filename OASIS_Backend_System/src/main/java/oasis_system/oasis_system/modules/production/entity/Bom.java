package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể Bom ánh xạ tới bảng 'boms' trong Cơ sở dữ liệu.
 * Thiết lập định mức nguyên vật liệu (Bill of Materials) hao phí cấu thành cho một đơn vị sản phẩm.
 */
@Entity
@Table(name = "boms", 
       uniqueConstraints = @UniqueConstraint(name = "unique_bom_product_material", columnNames = {"product_id", "material_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "quantity_required", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantityRequired; // Số lượng vật tư định lượng cần thiết
}
