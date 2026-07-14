package oasis_system.oasis_system.modules.auth.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * TokenBlacklistService quản lý việc lưu vết và tra cứu danh sách đen (Blacklist) các token JWT đã đăng xuất.
 * Hỗ trợ cơ chế dự phòng tự động (In-memory Fallback) khi Redis chưa được khởi chạy ở môi trường Local.
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final StringRedisTemplate redisTemplate;

    // Bộ nhớ đệm dự phòng trên RAM Local khi không kết nối được Redis
    private final ConcurrentHashMap<String, Long> inMemoryBlacklist = new ConcurrentHashMap<>();
    private boolean isRedisAvailable = true;

    /**
     * Đưa Token JWT vào danh sách đen để hủy bỏ hiệu lực.
     */
    public void blacklistToken(String token, long expirationMs) {
        if (expirationMs > 0) {
            if (isRedisAvailable) {
                try {
                    redisTemplate.opsForValue().set(token, "revoked", expirationMs, TimeUnit.MILLISECONDS);
                    return;
                } catch (Exception e) {
                    log.warn("⚠️ Không thể kết nối tới Redis Server. Tự động chuyển sang sử dụng bộ nhớ đệm RAM Local. Chi tiết: {}", e.getMessage());
                    isRedisAvailable = false;
                }
            }
            // Cơ chế dự phòng: Lưu vào RAM Local kèm thời gian hết hạn
            inMemoryBlacklist.put(token, System.currentTimeMillis() + expirationMs);
        }
    }

    /**
     * Kiểm tra xem Token JWT đã bị đăng xuất trước đó hay chưa.
     */
    public boolean isTokenBlacklisted(String token) {
        if (isRedisAvailable) {
            try {
                return Boolean.TRUE.equals(redisTemplate.hasKey(token));
            } catch (Exception e) {
                log.warn("⚠️ Không thể kết nối tới Redis Server. Tự động chuyển sang sử dụng bộ nhớ đệm RAM Local. Chi tiết: {}", e.getMessage());
                isRedisAvailable = false;
            }
        }
        
        // Cơ chế dự phòng: Kiểm tra từ RAM Local
        Long expiry = inMemoryBlacklist.get(token);
        if (expiry == null) {
            return false;
        }
        if (expiry < System.currentTimeMillis()) {
            inMemoryBlacklist.remove(token); // Xóa token đã hết hạn để giải phóng bộ nhớ
            return false;
        }
        return true;
    }
}
