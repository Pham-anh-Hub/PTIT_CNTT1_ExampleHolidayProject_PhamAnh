package oasis_system.oasis_system.modules.payroll.office.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.modules.payroll.office.dto.OfficePayrollDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payroll/office")
@RequiredArgsConstructor
public class OfficePayrollController {

    @GetMapping
    public ResponseEntity<ApiResponse<List<OfficePayrollDto>>> getOfficePayroll(@RequestParam String period) {
        List<OfficePayrollDto> list = new ArrayList<>();
        list.add(OfficePayrollDto.builder()
                .stt(1)
                .employeeId(10L)
                .employeeCode("CTY001-OFF-001")
                .employeeName("Nguyễn Văn A")
                .departmentName("Kế toán")
                .baseSalary(BigDecimal.valueOf(15000000))
                .allowance(BigDecimal.valueOf(1000000))
                .otHours(10.5)
                .otAmount(BigDecimal.valueOf(1200000))
                .lateCount(2)
                .latePenaltyAmount(BigDecimal.valueOf(300000))
                .lateNote("Đi muộn 2 lần (30 phút)")
                .otherBonus(BigDecimal.valueOf(1000000))
                .netSalary(BigDecimal.valueOf(17900000))
                .status("Chưa giải quyết")
                .build());

        return ResponseEntity.ok(ApiResponse.success("Lấy bảng lương khối văn phòng thành công", list));
    }

    @PutMapping("/{id}/adjustments")
    public ResponseEntity<ApiResponse<OfficePayrollDto>> updateAdjustments(
            @PathVariable Long id,
            @RequestBody OfficePayrollDto request) {
        request.setStatus("Đã giải quyết");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật giờ OT và phạt đi muộn thành công", request));
    }
}
