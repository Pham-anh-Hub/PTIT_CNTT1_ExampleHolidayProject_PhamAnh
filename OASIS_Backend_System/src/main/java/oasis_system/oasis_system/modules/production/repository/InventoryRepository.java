package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * InventoryRepository quản lý các truy vấn kho hàng (inventories).
 */
@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * Lấy tồn kho của một mặt hàng (thành phẩm hoặc nguyên vật liệu) thuộc doanh nghiệp.
     */
    @Query("SELECT i FROM Inventory i WHERE i.company.id = :companyId AND i.itemType = :itemType AND i.itemId = :itemId")
    Optional<Inventory> findByCompanyIdAndItemTypeAndItemId(
            @Param("companyId") Long companyId,
            @Param("itemType") String itemType,
            @Param("itemId") Long itemId
    );
}
