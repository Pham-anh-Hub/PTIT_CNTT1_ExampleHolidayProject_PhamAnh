package oasis_system.oasis_system.core.exception;

import lombok.*;

/**
 * Lớp ApiResponse định dạng cấu trúc JSON trả về thống nhất cho toàn bộ các API của hệ thống.
 * 
 * @param <T> Kiểu dữ liệu của payload trả về trong trường 'data'
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

    private int code;       // HTTP Status Code hoặc mã lỗi nội bộ
    private String message;  // Thông điệp kết quả
    private T data;          // Dữ liệu trả về thực tế

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message("Success")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .data(null)
                .build();
    }
}
