package oasis_system.oasis_system.modules.bod.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.bod.dto.ActionReasonDto;
import oasis_system.oasis_system.modules.bod.dto.CustomerDebtAgingDto;
import oasis_system.oasis_system.modules.bod.dto.CustomerSummaryDto;
import oasis_system.oasis_system.modules.bod.dto.OrderDetailWithDebtDto;
import oasis_system.oasis_system.modules.bod.service.BodSalesService;
import oasis_system.oasis_system.modules.crm.entity.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BodSalesController cung cấp các API giám sát và phê duyệt mảng Đơn hàng & Công nợ (Sales) cho BOD.
 */
@RestController
@RequestMapping("/api/v1/bod/sales")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BOD', 'DIRECTOR')")
public class BodSalesController {

    private final BodSalesService bodSalesService;

    // ==================== 1. PHÊ DUYỆT ĐƠN HÀNG (ORDERS) ====================

    @GetMapping("/orders/pending")
    public ResponseEntity<ApiResponse<List<Order>>> getPendingOrders() {
        List<Order> orders = bodSalesService.getPendingOrders();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng chờ duyệt thành công.", orders));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderDetailWithDebtDto>> getOrderDetailWithDebt(@PathVariable Long id) {
        OrderDetailWithDebtDto detail = bodSalesService.getOrderDetailWithDebt(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng và nợ của khách hàng thành công.", detail));
    }

    @PutMapping("/orders/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveOrder(@PathVariable Long id) {
        bodSalesService.approveOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt đơn hàng thành công.", null));
    }

    @PutMapping("/orders/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectOrder(
            @PathVariable Long id, 
            @Valid @RequestBody ActionReasonDto reasonDto
    ) {
        bodSalesService.rejectOrder(id, reasonDto.getReason());
        return ResponseEntity.ok(ApiResponse.success("Từ chối đơn hàng thành công.", null));
    }

    // ==================== 2. QUẢN TRỊ RỦI RO CÔNG NỢ (AGING REPORT FIFO) ====================

    @GetMapping("/debts/aging")
    public ResponseEntity<ApiResponse<List<CustomerDebtAgingDto>>> getCustomerDebtAgingReport() {
        List<CustomerDebtAgingDto> report = bodSalesService.getCustomerDebtAgingReport();
        return ResponseEntity.ok(ApiResponse.success("Lấy báo cáo tuổi nợ thành công.", report));
    }

    // ==================== 3. GIÁM SÁT DANH MỤC KHÁCH HÀNG (CUSTOMER PORTFOLIO) ====================

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<CustomerSummaryDto>>> getCustomerSummaryList() {
        List<CustomerSummaryDto> list = bodSalesService.getCustomerSummaryList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục khách hàng thành công.", list));
    }
}
