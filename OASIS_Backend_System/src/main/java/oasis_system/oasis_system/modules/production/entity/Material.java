package oasis_system.oasis_system.modules.production.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;

import java.math.BigDecimal;

/**
 * Thực thể Material ánh xạ tới bảng 'materials' trong Cơ sở dữ liệu.
 * Quản lý danh mục nguyên vật liệu dùng cho sản xuất và kiểm định định mức BOM.
 */
@Entity
@Table(name = "materials", 
       uniqueConstraints = @UniqueConstraint(name = "unique_material_code_company", columnNames = {"code", "company_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

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
    private String unit; // Đơn vị tính (ví dụ: mét, cái, kg)

    @Column(name = "min_stock_threshold", nullable = false)
    @Builder.Default
    private BigDecimal minStockThreshold = BigDecimal.ZERO; // Ngưỡng tồn tối thiểu để báo động
}
