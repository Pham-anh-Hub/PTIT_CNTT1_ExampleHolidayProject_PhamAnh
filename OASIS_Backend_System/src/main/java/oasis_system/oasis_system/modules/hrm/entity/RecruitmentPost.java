package oasis_system.oasis_system.modules.hrm.entity;

import jakarta.persistence.*;
import lombok.*;
import oasis_system.oasis_system.modules.auth.entity.Company;
import oasis_system.oasis_system.modules.auth.entity.User;

import java.time.LocalDateTime;

/**
 * Thực thể RecruitmentPost ánh xạ tới bảng 'recruitment_posts' trong Cơ sở dữ liệu.
 * 
 * 💡 Ý nghĩa nghiệp vụ:
 * Bảng này đóng vai trò lưu trữ vết (Archiving) các tin/bài viết tuyển dụng mà bộ phận
 * Nhân sự (HR) đã đăng tải lên các nền tảng tuyển dụng bên ngoài (như Facebook, LinkedIn,
 * TopCV, VietnamWorks,...). 
 * Hệ thống không tích hợp chức năng đẩy tin tự động, mà đóng vai trò là "Thư viện lưu trữ 
 * các bài đăng tuyển dụng" để giúp HR dễ dàng quản lý nội dung mô tả công việc (JD), 
 * liên kết (URL) dẫn tới bài đăng gốc và phân tích nguồn ứng viên sau này.
 */
@Entity
@Table(name = "recruitment_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitmentPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Company company; // Bảo đảm cách ly dữ liệu Multi-tenant

    @Column(nullable = false)
    private String title; // Tiêu đề tin tuyển dụng (ví dụ: Tuyển dụng lập trình viên Java 2026)

    @Column(columnDefinition = "TEXT")
    private String content; // Nội dung bài đăng / Bản mô tả công việc (Job Description - JD)

    @Column(name = "external_url", length = 500)
    private String externalUrl; // Đường link gốc dẫn tới tin tuyển dụng đã đăng (ví dụ: link bài đăng Facebook/LinkedIn)

    @Column(length = 100)
    private String platform; // Nền tảng đăng tuyển (ví dụ: TopCV, LinkedIn, Facebook, VietnamWorks)

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "Đã đăng"; // Trạng thái của tin: Đã đăng, Hết hạn, Nháp

    @Column(name = "posted_at")
    private LocalDateTime postedAt; // Thời điểm thực hiện đăng bài tuyển dụng ở nền tảng ngoài

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private User createdBy; // Nhân viên HR lưu vết bài đăng này (FK liên kết với bảng users)

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now(); // Thời điểm lưu vết trên hệ thống của chúng ta
}
