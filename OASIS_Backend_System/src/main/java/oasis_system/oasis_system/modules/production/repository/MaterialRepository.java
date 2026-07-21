package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MaterialRepository quản lý các truy vấn cho thực thể Material.
 */
@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("SELECT m FROM Material m WHERE m.company.id = :companyId ORDER BY m.name ASC")
    List<Material> findByCompanyId(@Param("companyId") Long companyId);
}
