package oasis_system.oasis_system.modules.accounting.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.accounting.dto.CreateExpenseRequestDto;
import oasis_system.oasis_system.modules.accounting.entity.ExpenseVoucher;
import oasis_system.oasis_system.modules.accounting.entity.ProjectBudget;
import oasis_system.oasis_system.modules.accounting.repository.ExpenseVoucherRepository;
import oasis_system.oasis_system.modules.accounting.repository.ProjectBudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountingExpenseService {

    private final ExpenseVoucherRepository expenseVoucherRepository;
    private final ProjectBudgetRepository projectBudgetRepository;

    @Transactional(readOnly = true)
    public List<ExpenseVoucher> getAllExpenses() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }
        return expenseVoucherRepository.findByCompanyId(companyId);
    }

    @Transactional
    public ExpenseVoucher createExpense(CreateExpenseRequestDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        String voucherCode = "EV-" + System.currentTimeMillis();

        ExpenseVoucher expense = ExpenseVoucher.builder()
                .companyId(companyId)
                .voucherCode(voucherCode)
                .category(dto.getCategory())
                .refId(dto.getRefId())
                .recipientName(dto.getRecipientName())
                .amount(dto.getAmount())
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "BANK_TRANSFER")
                .note(dto.getNote())
                .createdAt(LocalDateTime.now())
                .build();

        ExpenseVoucher saved = expenseVoucherRepository.save(expense);

        // Update ProjectBudget if category is PROJECT or MATERIAL linked to a project
        if (dto.getRefId() != null && ("PROJECT".equalsIgnoreCase(dto.getCategory()) || "MATERIAL".equalsIgnoreCase(dto.getCategory()))) {
            Optional<ProjectBudget> budgetOpt = projectBudgetRepository.findByCompanyIdAndProjectId(companyId, dto.getRefId());
            if (budgetOpt.isPresent()) {
                ProjectBudget budget = budgetOpt.get();
                budget.setActualSpent(budget.getActualSpent().add(dto.getAmount()));
                if ("MATERIAL".equalsIgnoreCase(dto.getCategory())) {
                    budget.setActualMaterialCost(budget.getActualMaterialCost().add(dto.getAmount()));
                } else {
                    budget.setActualOtherCost(budget.getActualOtherCost().add(dto.getAmount()));
                }
                projectBudgetRepository.save(budget);
            }
        }

        return saved;
    }
}
