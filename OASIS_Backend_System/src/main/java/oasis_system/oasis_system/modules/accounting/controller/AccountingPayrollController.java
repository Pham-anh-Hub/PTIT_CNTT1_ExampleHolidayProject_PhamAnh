package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.entity.ExpenseVoucher;
import oasis_system.oasis_system.modules.accounting.service.AccountingPayrollService;
import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounting/payroll")
@RequiredArgsConstructor
public class AccountingPayrollController {

    private final AccountingPayrollService accountingPayrollService;

    @PostMapping("/aggregate")
    public ResponseEntity<ApiResponse<List<Payroll>>> aggregatePayroll(@RequestParam String period) {
        List<Payroll> aggregated = accountingPayrollService.aggregatePayroll(period);
        return ResponseEntity.ok(ApiResponse.success("Tổng hợp dữ liệu chấm công và tính bảng lương thành công", aggregated));
    }

    @PostMapping("/{payrollId}/disburse")
    public ResponseEntity<ApiResponse<ExpenseVoucher>> disbursePayroll(@PathVariable Long payrollId) {
        ExpenseVoucher voucher = accountingPayrollService.disbursePayroll(payrollId);
        return ResponseEntity.ok(ApiResponse.success("Lập phiếu chi giải ngân lương thành công", voucher));
    }
}
