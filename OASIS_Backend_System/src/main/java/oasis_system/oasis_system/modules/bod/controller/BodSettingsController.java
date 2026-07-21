package oasis_system.oasis_system.modules.bod.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.AuditLogResponseDto;
import oasis_system.oasis_system.modules.bod.dto.BodApprovalThresholdDto;
import oasis_system.oasis_system.modules.bod.service.BodSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodSettingsController cung cấp các API REST quản lý Cấu hình hệ thống và Tra cứu Nhật ký hoạt động cho Giám đốc (BOD).
 */
@RestController
@RequestMapping("/api/v1/bod/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BOD', 'DIRECTOR')")
public class BodSettingsController {

    private final BodSettingsService bodSettingsService;

    // ==================== 1. NHẬT KÝ HOẠT ĐỘNG (EXECUTIVE AUDIT LOGS) ====================

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogResponseDto>>> getAuditLogs(
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String action) {
        List<AuditLogResponseDto> logs = bodSettingsService.getAuditLogs(documentType, action);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Nhật ký hoạt động thành công.", logs));
    }

    // ==================== 2. CẤU HÌNH NGƯỠNG PHÊ DUYỆT RỦI RO (APPROVAL THRESHOLDS) ====================

    @GetMapping("/thresholds")
    public ResponseEntity<ApiResponse<List<BodApprovalThresholdDto>>> getApprovalThresholds() {
        List<BodApprovalThresholdDto> thresholds = bodSettingsService.getApprovalThresholds();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cấu hình ngưỡng phê duyệt thành công.", thresholds));
    }

    @PutMapping("/thresholds")
    public ResponseEntity<ApiResponse<List<BodApprovalThresholdDto>>> updateApprovalThresholds(
            @Valid @RequestBody List<BodApprovalThresholdDto> dtos) {
        List<BodApprovalThresholdDto> updatedThresholds = bodSettingsService.updateApprovalThresholds(dtos);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình ngưỡng phê duyệt thành công.", updatedThresholds));
    }
}
