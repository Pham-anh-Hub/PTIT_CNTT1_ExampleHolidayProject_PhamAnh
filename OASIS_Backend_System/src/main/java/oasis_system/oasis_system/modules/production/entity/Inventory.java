package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Thực thể Inventory ánh xạ tới bảng 'inventories' trong Cơ sở dữ liệu.
 * Theo dõi số lượng tồn kho thực tế của cả thành phẩm (PRODUCT) và nguyên vật liệu (MATERIAL).
 */
@Entity
@Table(name = "inventories", 
       uniqueConstraints = @UniqueConstraint(name = "unique_inventory_company_item", columnNames = {"company_id", "item_type", "item_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "item_type", nullable = false, length = 50)
    private String itemType; // PRODUCT, MATERIAL

    @Column(name = "item_id", nullable = false)
    private Long itemId; // Liên kết tới Product.id hoặc Material.id tùy theo itemType

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
