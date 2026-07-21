package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.dto.TaxSummaryDto;
import oasis_system.oasis_system.modules.accounting.service.AccountingReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/accounting/reports")
@RequiredArgsConstructor
public class AccountingReportController {

    private final AccountingReportService accountingReportService;

    @GetMapping("/tax/summary")
    public ResponseEntity<ApiResponse<TaxSummaryDto>> getTaxSummary(@RequestParam(required = false) String period) {
        TaxSummaryDto taxSummary = accountingReportService.getTaxSummary(period);
        return ResponseEntity.ok(ApiResponse.success("Lấy báo cáo thuế thực tế thành công", taxSummary));
    }
}
