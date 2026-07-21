package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.dto.CashFlowSummaryDto;
import oasis_system.oasis_system.modules.accounting.dto.CreateReceiptRequestDto;
import oasis_system.oasis_system.modules.accounting.entity.ReceiptVoucher;
import oasis_system.oasis_system.modules.accounting.service.AccountingReceiptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounting/receipts")
@RequiredArgsConstructor
public class AccountingReceiptController {

    private final AccountingReceiptService accountingReceiptService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReceiptVoucher>>> getAllReceipts() {
        List<ReceiptVoucher> list = accountingReceiptService.getAllReceipts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu thu thành công", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReceiptVoucher>> createReceipt(@RequestBody CreateReceiptRequestDto dto) {
        ReceiptVoucher receipt = accountingReceiptService.createReceipt(dto);
        return ResponseEntity.ok(ApiResponse.success("Lập phiếu thu thành công", receipt));
    }

    @GetMapping("/cash-flow/summary")
    public ResponseEntity<ApiResponse<CashFlowSummaryDto>> getCashFlowSummary(@RequestParam(required = false) String period) {
        CashFlowSummaryDto summary = accountingReceiptService.getCashFlowSummary(period);
        return ResponseEntity.ok(ApiResponse.success("Lấy tổng hợp dòng tiền thu/chi thành công", summary));
    }
}
