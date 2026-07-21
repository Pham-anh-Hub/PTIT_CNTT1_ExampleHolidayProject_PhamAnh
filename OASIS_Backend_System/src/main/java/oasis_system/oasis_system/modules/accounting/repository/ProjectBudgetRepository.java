package oasis_system.oasis_system.modules.accounting.repository;

import oasis_system.oasis_system.modules.accounting.entity.ProjectBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectBudgetRepository extends JpaRepository<ProjectBudget, Long> {
    Optional<ProjectBudget> findByCompanyIdAndProjectId(Long companyId, Long projectId);
}
