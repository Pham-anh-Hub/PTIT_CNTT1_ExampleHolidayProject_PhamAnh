package oasis_system.oasis_system.modules.accounting.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.accounting.dto.TaxSummaryDto;
import oasis_system.oasis_system.modules.accounting.repository.ExpenseVoucherRepository;
import oasis_system.oasis_system.modules.accounting.repository.ReceiptVoucherRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class AccountingReportService {

    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final ExpenseVoucherRepository expenseVoucherRepository;

    public TaxSummaryDto getTaxSummary(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        YearMonth ym = (period != null && !period.isBlank()) ? YearMonth.parse(period) : YearMonth.now();
        LocalDateTime startDate = ym.atDay(1).atStartOfDay();
        LocalDateTime endDate = ym.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal totalReceipts = receiptVoucherRepository.sumAmountByCompanyIdAndDateRange(companyId, startDate, endDate);
        if (totalReceipts == null) totalReceipts = BigDecimal.ZERO;

        BigDecimal totalMaterialExpenses = expenseVoucherRepository.sumAmountByCompanyIdAndCategoryAndDateRange(companyId, "MATERIAL", startDate, endDate);
        if (totalMaterialExpenses == null) totalMaterialExpenses = BigDecimal.ZERO;

        // Tính toán các mục thuế theo tỷ lệ thực tế SME
        BigDecimal vatOutbound = totalReceipts.multiply(BigDecimal.valueOf(0.10)); // VAT đầu ra 10%
        BigDecimal vatInbound = totalMaterialExpenses.multiply(BigDecimal.valueOf(0.10)); // VAT đầu vào 10%
        BigDecimal vatNetPayable = vatOutbound.subtract(vatInbound).max(BigDecimal.ZERO);

        BigDecimal outsourcingTax = totalReceipts.multiply(BigDecimal.valueOf(0.02)); // 2% thuế gia công sản xuất
        BigDecimal incomeTaxEstimated = totalReceipts.multiply(BigDecimal.valueOf(0.05)); // Thuế thu nhập ước tính

        return TaxSummaryDto.builder()
                .period(ym.toString())
                .manufacturingOutsourcingTax(outsourcingTax)
                .incomeTaxEstimated(incomeTaxEstimated)
                .vatOutbound(vatOutbound)
                .vatInbound(vatInbound)
                .vatNetPayable(vatNetPayable)
                .build();
    }
}
