package oasis_system.oasis_system.modules.production.repository;

import oasis_system.oasis_system.modules.production.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProductRepository quản lý các truy vấn cho thực thể Product.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE p.company.id = :companyId ORDER BY p.name ASC")
    List<Product> findByCompanyId(@Param("companyId") Long companyId);
}
