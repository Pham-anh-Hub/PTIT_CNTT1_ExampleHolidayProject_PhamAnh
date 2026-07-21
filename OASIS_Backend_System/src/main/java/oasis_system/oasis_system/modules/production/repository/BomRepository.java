package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * BomRepository quản lý truy cập cơ sở dữ liệu cho bảng 'boms'.
 */
@Repository
public interface BomRepository extends JpaRepository<Bom, Long> {

    /**
     * Tìm danh sách định mức nguyên vật liệu của một sản phẩm thành phẩm.
     */
    @Query("SELECT b FROM Bom b JOIN FETCH b.material WHERE b.product.id = :productId")
    List<Bom> findByProductId(@Param("productId") Long productId);
}
