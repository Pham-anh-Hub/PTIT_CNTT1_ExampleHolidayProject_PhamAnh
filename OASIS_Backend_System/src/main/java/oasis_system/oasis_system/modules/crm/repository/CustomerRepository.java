package oasis_system.oasis_system.modules.crm.repository;

import oasis_system.oasis_system.modules.crm.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CustomerRepository cung cấp các phương thức truy vấn bảng 'customers'.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Lấy toàn bộ danh sách khách hàng thuộc doanh nghiệp.
     */
    List<Customer> findByCompanyId(Long companyId);
}
