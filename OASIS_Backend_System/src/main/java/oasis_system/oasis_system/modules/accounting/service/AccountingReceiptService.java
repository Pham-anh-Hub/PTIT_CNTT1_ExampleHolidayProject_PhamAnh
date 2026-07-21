package oasis_system.oasis_system.modules.accounting.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.accounting.dto.CashFlowSummaryDto;
import oasis_system.oasis_system.modules.accounting.dto.CreateReceiptRequestDto;
import oasis_system.oasis_system.modules.accounting.entity.ReceiptVoucher;
import oasis_system.oasis_system.modules.accounting.repository.ExpenseVoucherRepository;
import oasis_system.oasis_system.modules.accounting.repository.ReceiptVoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountingReceiptService {

    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final ExpenseVoucherRepository expenseVoucherRepository;

    @Transactional(readOnly = true)
    public List<ReceiptVoucher> getAllReceipts() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }
        return receiptVoucherRepository.findByCompanyId(companyId);
    }

    @Transactional
    public ReceiptVoucher createReceipt(CreateReceiptRequestDto dto) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L; // Fallback default tenant for safety
        }

        String voucherCode = "RV-" + System.currentTimeMillis();

        ReceiptVoucher receipt = ReceiptVoucher.builder()
                .companyId(companyId)
                .voucherCode(voucherCode)
                .orderId(dto.getOrderId())
                .customerId(dto.getCustomerId())
                .amount(dto.getAmount())
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "BANK_TRANSFER")
                .note(dto.getNote())
                .createdAt(LocalDateTime.now())
                .build();

        return receiptVoucherRepository.save(receipt);
    }

    public CashFlowSummaryDto getCashFlowSummary(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        YearMonth ym = (period != null && !period.isBlank()) ? YearMonth.parse(period) : YearMonth.now();
        LocalDateTime startDate = ym.atDay(1).atStartOfDay();
        LocalDateTime endDate = ym.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal totalInflow = receiptVoucherRepository.sumAmountByCompanyIdAndDateRange(companyId, startDate, endDate);
        BigDecimal totalOutflow = expenseVoucherRepository.sumAmountByCompanyIdAndDateRange(companyId, startDate, endDate);

        if (totalInflow == null) totalInflow = BigDecimal.ZERO;
        if (totalOutflow == null) totalOutflow = BigDecimal.ZERO;

        BigDecimal netCashFlow = totalInflow.subtract(totalOutflow);

        return CashFlowSummaryDto.builder()
                .totalInflow(totalInflow)
                .totalOutflow(totalOutflow)
                .netCashFlow(netCashFlow)
                .period(ym.toString())
                .build();
    }
}
