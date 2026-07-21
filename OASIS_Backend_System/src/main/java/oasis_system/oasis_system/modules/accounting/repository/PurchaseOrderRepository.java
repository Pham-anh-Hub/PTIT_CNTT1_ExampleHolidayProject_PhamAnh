package oasis_system.oasis_system.modules.accounting.repository;

import oasis_system.oasis_system.modules.accounting.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByCompanyId(Long companyId);
    List<PurchaseOrder> findByCompanyIdAndSupplierId(Long companyId, Long supplierId);
}
