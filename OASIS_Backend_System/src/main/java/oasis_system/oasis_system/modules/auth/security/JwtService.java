package oasis_system.oasis_system.modules.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Lớp JwtService xử lý các nghiệp vụ liên quan đến JSON Web Token (JWT).
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Java Spring Boot Component (@Service): Định nghĩa một service bean để Spring quản lý vòng đời và Dependency Injection.
 * 2. Dependency Injection (@Value): Tiêm các giá trị cấu hình từ file application.properties vào biến Java.
 * 3. Java Cryptography / JSON Web Token (Java Web Service & Security):
 *    - Sử dụng thuật toán HS256 (HMAC-SHA256) ký số JWT để ngăn chặn việc chỉnh sửa token giả mạo từ phía Client.
 *    - Đóng gói (Payload Claims) các thông tin SaaS đặc thù: companyId, roleId, departmentId, userId.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.accessToken-expiration-ms}")
    private long accessTokenExpiration;

    @Value("${jwt.refreshToken-expiration-ms}")
    private long refreshTokenExpiration;

    /**
     * Tạo khóa ký bí mật từ chuỗi Secret Key cấu hình.
     * Thuật toán HS256 yêu cầu khóa ký tối thiểu phải đạt 256 bits (32 bytes).
     * 
     * @return Key khóa dùng để ký JWT
     */
    private Key getSigningKey() {
        byte[] keyBytes = this.secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Trích xuất Email (Subject) của người dùng từ token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Trích xuất mã Doanh nghiệp (companyId) từ token để thực hiện cách ly dữ liệu.
     */
    public Long extractCompanyId(String token) {
        return extractClaim(token, claims -> claims.get("companyId", Long.class));
    }

    /**
     * Trích xuất mã vai trò (activeRoleId) của phiên làm việc hiện tại.
     */
    public Long extractRoleId(String token) {
        return extractClaim(token, claims -> claims.get("roleId", Long.class));
    }

    /**
     * Trích xuất mã phòng ban (activeDepartmentId) của phiên làm việc hiện tại.
     */
    public Long extractDepartmentId(String token) {
        return extractClaim(token, claims -> claims.get("departmentId", Long.class));
    }

    /**
     * Trích xuất mã User ID từ token.
     */
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    /**
     * Hàm Generic để trích xuất bất kỳ thông tin nào từ Payload Claims của Token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Giải mã Token để đọc toàn bộ Claims thông qua Signature Key.
     * Nếu token hết hạn hoặc chữ ký bị giả mạo, thư viện jjwt sẽ tự động ném ra ngoại lệ bảo mật.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Kiểm tra xem Token đã hết hạn chưa.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Trích xuất ngày hết hạn của token.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Tạo Access Token mới dựa trên CustomUserDetails.
     */
    public String generateAccessToken(CustomUserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userDetails.getUserId());
        claims.put("companyId", userDetails.getCompanyId());
        claims.put("roleId", userDetails.getActiveRoleId());
        claims.put("departmentId", userDetails.getActiveDepartmentId());
        
        return buildToken(claims, userDetails.getUsername(), accessTokenExpiration);
    }

    /**
     * Tạo Refresh Token mới (chỉ chứa email người dùng và companyId, thời hạn lâu hơn, không chứa vai trò để hạn chế kích thước).
     */
    public String generateRefreshToken(CustomUserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userDetails.getUserId());
        claims.put("companyId", userDetails.getCompanyId());
        
        return buildToken(claims, userDetails.getUsername(), refreshTokenExpiration);
    }

    /**
     * Quy trình xây dựng token JWT và ký số HS256.
     */
    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Kiểm tra tính hợp lệ của token JWT dựa trên User Details.
     * Xác minh sự trùng khớp giữa Email và trạng thái hết hạn của token.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
}
