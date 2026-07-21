package oasis_system.oasis_system.modules.accounting.repository;

import oasis_system.oasis_system.modules.accounting.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByCompanyId(Long companyId);
    Optional<Supplier> findByCompanyIdAndSupplierCode(Long companyId, String supplierCode);
}
