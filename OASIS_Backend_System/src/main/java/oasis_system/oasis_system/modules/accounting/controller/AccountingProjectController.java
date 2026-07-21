package oasis_system.oasis_system.modules.accounting.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.accounting.dto.ProjectBudgetStatusDto;
import oasis_system.oasis_system.modules.accounting.dto.ProjectProfitabilityDto;
import oasis_system.oasis_system.modules.accounting.service.AccountingProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/accounting/projects")
@RequiredArgsConstructor
public class AccountingProjectController {

    private final AccountingProjectService accountingProjectService;

    @GetMapping("/{projectId}/budget-status")
    public ResponseEntity<ApiResponse<ProjectBudgetStatusDto>> getBudgetStatus(@PathVariable Long projectId) {
        ProjectBudgetStatusDto status = accountingProjectService.getBudgetStatus(projectId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin ngân sách dự án thành công", status));
    }

    @GetMapping("/{projectId}/profitability")
    public ResponseEntity<ApiResponse<ProjectProfitabilityDto>> getProjectProfitability(@PathVariable Long projectId) {
        ProjectProfitabilityDto profitability = accountingProjectService.getProjectProfitability(projectId);
        return ResponseEntity.ok(ApiResponse.success("Thống kê lợi nhuận gộp dự án thành công", profitability));
    }
}
