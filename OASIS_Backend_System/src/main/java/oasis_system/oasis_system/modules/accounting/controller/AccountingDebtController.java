package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.dto.CustomerDebtDto;
import oasis_system.oasis_system.modules.accounting.dto.PaymentScheduleDto;
import oasis_system.oasis_system.modules.accounting.service.AccountingDebtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounting/debts")
@RequiredArgsConstructor
public class AccountingDebtController {

    private final AccountingDebtService accountingDebtService;

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<CustomerDebtDto>>> getCustomerDebts() {
        List<CustomerDebtDto> debts = accountingDebtService.getCustomerDebts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách công nợ khách hàng thành công", debts));
    }

    @GetMapping("/orders/{orderId}/payment-schedule")
    public ResponseEntity<ApiResponse<PaymentScheduleDto>> getPaymentSchedule(@PathVariable Long orderId) {
        PaymentScheduleDto schedule = accountingDebtService.getPaymentSchedule(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử đợt thanh toán đơn hàng thành công", schedule));
    }
}
