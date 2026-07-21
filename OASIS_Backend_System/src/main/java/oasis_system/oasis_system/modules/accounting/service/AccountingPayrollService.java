package oasis_system.oasis_system.modules.accounting.service;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.tenant.TenantContext;
import oasis_system.oasis_system.modules.accounting.entity.ExpenseVoucher;
import oasis_system.oasis_system.modules.accounting.repository.ExpenseVoucherRepository;
import oasis_system.oasis_system.modules.hrm.entity.Employee;
import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import oasis_system.oasis_system.modules.hrm.repository.EmployeeRepository;
import oasis_system.oasis_system.modules.hrm.repository.PayrollRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountingPayrollService {

    private final EmployeeRepository employeeRepository;
    private final PayrollRepository payrollRepository;
    private final ExpenseVoucherRepository expenseVoucherRepository;

    @Transactional
    public List<Payroll> aggregatePayroll(String period) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        List<Employee> employees = employeeRepository.findByCompanyId(companyId);
        List<Payroll> aggregatedList = new ArrayList<>();

        for (Employee emp : employees) {
            Optional<Payroll> existingOpt = payrollRepository.findByEmployeeIdAndPeriod(emp.getId(), period);
            Payroll payroll;
            if (existingOpt.isPresent()) {
                payroll = existingOpt.get();
            } else {
                BigDecimal baseComp = BigDecimal.valueOf(10000000); // Mẫu định mức lương cơ bản
                BigDecimal prodComp = BigDecimal.valueOf(3500000);  // Mẫu tổng lương công đoạn sản xuất
                BigDecimal allowances = BigDecimal.valueOf(1000000);
                BigDecimal overtime = BigDecimal.valueOf(1500000);
                BigDecimal bhxh = BigDecimal.valueOf(1050000);
                BigDecimal tax = BigDecimal.valueOf(500000);

                BigDecimal total = baseComp.add(prodComp).add(allowances).add(overtime)
                        .subtract(bhxh).subtract(tax);

                payroll = Payroll.builder()
                        .employee(emp)
                        .period(period)
                        .baseComponent(baseComp)
                        .productionComponent(prodComp)
                        .allowance(allowances)
                        .overtimeAmount(overtime)
                        .deductionBhxh(bhxh)
                        .deductionTax(tax)
                        .deductionAdvance(BigDecimal.ZERO)
                        .totalAmount(total)
                        .status("approved")
                        .createdAt(LocalDateTime.now())
                        .build();
                payroll = payrollRepository.save(payroll);
            }
            aggregatedList.add(payroll);
        }

        return aggregatedList;
    }

    @Transactional
    public ExpenseVoucher disbursePayroll(Long payrollId) {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            companyId = 1L;
        }

        Optional<Payroll> payrollOpt = payrollRepository.findById(payrollId);
        if (payrollOpt.isEmpty()) {
            throw new RuntimeException("Bảng lương không tồn tại");
        }

        Payroll payroll = payrollOpt.get();
        payroll.setStatus("paid");
        payrollRepository.save(payroll);

        String voucherCode = "EV-PAYROLL-" + payroll.getPeriod() + "-" + payroll.getId();

        ExpenseVoucher voucher = ExpenseVoucher.builder()
                .companyId(companyId)
                .voucherCode(voucherCode)
                .category("PAYROLL")
                .refId(payroll.getId())
                .recipientName(payroll.getEmployee().getFullname())
                .amount(payroll.getTotalAmount())
                .paymentMethod("BANK_TRANSFER")
                .note("Chi trả lương nhân viên tháng " + payroll.getPeriod())
                .createdAt(LocalDateTime.now())
                .build();

        return expenseVoucherRepository.save(voucher);
    }
}
