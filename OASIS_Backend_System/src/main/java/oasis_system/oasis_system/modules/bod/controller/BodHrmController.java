package oasis_system.oasis_system.modules.bod.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.ActionReasonDto;
import oasis_system.oasis_system.modules.bod.dto.HrAnalyticsResponse;
import oasis_system.oasis_system.modules.bod.dto.PayrollSummaryDto;
import oasis_system.oasis_system.modules.bod.entity.ApprovalLog;
import oasis_system.oasis_system.modules.bod.service.BodHrmService;
import oasis_system.oasis_system.modules.hrm.entity.Contract;
import oasis_system.oasis_system.modules.hrm.entity.LeaveRequest;
import oasis_system.oasis_system.modules.hrm.entity.Payroll;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodHrmController cung cấp các API nghiệp vụ đối với nhân sự cho Ban Giám đốc (BOD).
 */
@RestController
@RequestMapping("/api/v1/bod/hrm")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BOD', 'DIRECTOR')")
public class BodHrmController {

    private final BodHrmService bodHrmService;

    // ==================== 1. NGHIỆP VỤ DUYỆT HỢP ĐỒNG LAO ĐỘNG ====================

    @GetMapping("/contracts/pending")
    public ResponseEntity<ApiResponse<List<Contract>>> getPendingContracts() {
        List<Contract> contracts = bodHrmService.getPendingContracts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hợp đồng chờ duyệt thành công.", contracts));
    }

    @PutMapping("/contracts/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveContract(@PathVariable Long id) {
        bodHrmService.approveContract(id);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt hợp đồng lao động thành công.", null));
    }

    @PutMapping("/contracts/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectContract(
            @PathVariable Long id, 
            @Valid @RequestBody ActionReasonDto reasonDto
    ) {
        bodHrmService.rejectContract(id, reasonDto.getReason());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối hợp đồng lao động.", null));
    }

    // ==================== 2. NGHIỆP VỤ PHÊ DUYỆT & GIÁM SÁT QUỸ LƯƠNG THÁNG ====================

    @GetMapping("/payrolls")
    public ResponseEntity<ApiResponse<List<PayrollSummaryDto>>> getMonthlyPayrollSummary() {
        List<PayrollSummaryDto> summaries = bodHrmService.getMonthlyPayrollSummary();
        return ResponseEntity.ok(ApiResponse.success("Lấy tóm tắt quỹ lương thành công.", summaries));
    }

    @GetMapping("/payrolls/{period}")
    public ResponseEntity<ApiResponse<List<Payroll>>> getPayrollDetailsByPeriod(@PathVariable String period) {
        List<Payroll> details = bodHrmService.getPayrollDetailsByPeriod(period);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết bảng lương chu kỳ " + period + " thành công.", details));
    }

    @PutMapping("/payrolls/{period}/approve")
    public ResponseEntity<ApiResponse<Void>> approvePayroll(@PathVariable String period) {
        bodHrmService.approvePayroll(period);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bảng lương chu kỳ " + period + " thành công.", null));
    }

    @PutMapping("/payrolls/{period}/pay")
    public ResponseEntity<ApiResponse<Void>> payPayroll(@PathVariable String period) {
        bodHrmService.payPayroll(period);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận chi tiền bảng lương chu kỳ " + period + " thành công.", null));
    }

    // ==================== 3. NGHIỆP VỤ XEM BÁO CÁO NHÂN SỰ ====================

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<HrAnalyticsResponse>> getHrAnalytics() {
        HrAnalyticsResponse analytics = bodHrmService.getHrAnalytics();
        return ResponseEntity.ok(ApiResponse.success("Lấy báo cáo phân tích nhân sự thành công.", analytics));
    }

    // ==================== 4. NGHIỆP VỤ PHÊ DUYỆT NGHỈ PHÉP NGOẠI LỆ ====================

    @GetMapping("/leaves/pending")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getPendingLeaveRequests() {
        List<LeaveRequest> requests = bodHrmService.getPendingLeaveRequests();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn nghỉ phép chờ duyệt thành công.", requests));
    }

    @PutMapping("/leaves/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveLeaveRequest(@PathVariable Long id) {
        bodHrmService.approveLeaveRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt đơn xin nghỉ phép thành công.", null));
    }

    @PutMapping("/leaves/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectLeaveRequest(
            @PathVariable Long id, 
            @Valid @RequestBody ActionReasonDto reasonDto
    ) {
        bodHrmService.rejectLeaveRequest(id, reasonDto.getReason());
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đơn xin nghỉ phép.", null));
    }

    // ==================== 5. XEM LỊCH SỬ PHÊ DUYỆT ====================

    @GetMapping("/approval-logs")
    public ResponseEntity<ApiResponse<List<ApprovalLog>>> getApprovalLogs() {
        List<ApprovalLog> logs = bodHrmService.getApprovalLogs();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch sử phê duyệt thành công.", logs));
    }
}
