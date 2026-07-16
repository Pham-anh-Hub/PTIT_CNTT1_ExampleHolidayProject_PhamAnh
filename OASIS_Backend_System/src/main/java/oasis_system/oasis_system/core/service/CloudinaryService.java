package oasis_system.oasis_system.core.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * CloudinaryService đóng gói logic đẩy hình ảnh thực tế lên Cloudinary.
 */
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Tải hình ảnh lên Cloudinary và trả về đường dẫn URL an toàn (https).
     *
     * @param file Tệp hình ảnh được tải lên từ client
     * @param folder Thư mục lưu trữ trên Cloudinary
     * @return Chuỗi URL của hình ảnh trên Cloudinary
     * @throws IOException Lỗi khi đọc tệp tin
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Không thể tải lên tệp tin rỗng.");
        }

        // Đảm bảo tệp tải lên là ảnh
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ chấp nhận tệp tin định dạng hình ảnh.");
        }

        // Cấu hình tham số upload: chỉ định folder lưu trữ
        Map params = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image"
        );

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        return uploadResult.get("secure_url").toString();
    }
}
