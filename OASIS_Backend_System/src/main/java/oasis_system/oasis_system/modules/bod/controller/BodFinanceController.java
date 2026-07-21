package oasis_system.oasis_system.modules.bod.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.FinancialHealthRadarDto;
import oasis_system.oasis_system.modules.bod.dto.PayrollDisbursementAnalysisDto;
import oasis_system.oasis_system.modules.bod.service.BodFinanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodFinanceController cung cấp các API nghiệp vụ kiểm soát tài chính và duyệt chi cho Giám đốc (BOD).
 */
@RestController
@RequestMapping("/api/v1/bod/finance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BOD', 'DIRECTOR')")
public class BodFinanceController {

    private final BodFinanceService bodFinanceService;

    // ==================== 1. PHÊ DUYỆT QUỸ LƯƠNG TỔNG (ỦY NHIỆM CHI NGÂN HÀNG) ====================

    @GetMapping("/payrolls/pending")
    public ResponseEntity<ApiResponse<List<String>>> getPendingPayrollDisbursements() {
        List<String> pendingPeriods = bodFinanceService.getPendingPayrollDisbursements();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chu kỳ lương chờ duyệt chi thành công.", pendingPeriods));
    }

    @GetMapping("/payrolls/{period}/analysis")
    public ResponseEntity<ApiResponse<PayrollDisbursementAnalysisDto>> getPayrollDisbursementAnalysis(@PathVariable String period) {
        PayrollDisbursementAnalysisDto analysis = bodFinanceService.getPayrollDisbursementAnalysis(period);
        return ResponseEntity.ok(ApiResponse.success("Phân tích cơ cấu quỹ lương chu kỳ " + period + " thành công.", analysis));
    }

    @PutMapping("/payrolls/{period}/authorize")
    public ResponseEntity<ApiResponse<Void>> authorizePayrollDisbursement(@PathVariable String period) {
        bodFinanceService.authorizePayrollDisbursement(period);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt Ủy nhiệm chi Quỹ lương tháng " + period + " gửi Ngân hàng.", null));
    }

    // ==================== 2. RADAR SỨC KHỎE TÀI CHÍNH & LỢI NHUẬN RÒNG ====================

    @GetMapping("/health-radar")
    public ResponseEntity<ApiResponse<FinancialHealthRadarDto>> getFinancialHealthRadar() {
        FinancialHealthRadarDto radar = bodFinanceService.getFinancialHealthRadar();
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu Radar sức khỏe tài chính và lợi nhuận ròng thành công.", radar));
    }
}
