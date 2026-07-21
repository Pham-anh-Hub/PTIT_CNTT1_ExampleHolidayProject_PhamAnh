package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.dto.CreateExpenseRequestDto;
import oasis_system.oasis_system.modules.accounting.entity.ExpenseVoucher;
import oasis_system.oasis_system.modules.accounting.service.AccountingExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounting/expenses")
@RequiredArgsConstructor
public class AccountingExpenseController {

    private final AccountingExpenseService accountingExpenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseVoucher>>> getAllExpenses() {
        List<ExpenseVoucher> list = accountingExpenseService.getAllExpenses();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu chi thành công", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseVoucher>> createExpense(@RequestBody CreateExpenseRequestDto dto) {
        ExpenseVoucher expense = accountingExpenseService.createExpense(dto);
        return ResponseEntity.ok(ApiResponse.success("Lập phiếu chi thành công", expense));
    }
}
