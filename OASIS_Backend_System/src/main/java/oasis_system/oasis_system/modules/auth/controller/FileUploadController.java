package oasis_system.oasis_system.modules.auth.controller;

import lombok.RequiredArgsConstructor;
import oasis_system.oasis_system.core.exception.ApiResponse;
import oasis_system.oasis_system.core.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * FileUploadController quản lý các API upload file trong hệ thống.
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    /**
     * API Tải ảnh đại diện nhân viên lên Cloudinary.
     * Cho phép các tài khoản mang vai trò 'ADMIN_DN' hoặc 'HR_STAFF' gọi.
     * 
     * @param file Tệp ảnh tải lên
     * @return ResponseEntity chứa URL an toàn trên Cloudinary
     * @throws IOException Lỗi I/O khi đẩy file lên Cloudinary
     */
    @PostMapping("/upload-avatar")
    @PreAuthorize("hasAnyRole('ADMIN_DN', 'HR_STAFF')")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = cloudinaryService.uploadImage(file, "oasis_avatars");
        return ResponseEntity.ok(
                ApiResponse.success("Tải ảnh đại diện lên máy chủ Cloudinary thành công.", imageUrl)
        );
    }
}
