package oasis_system.oasis_system.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Lớp RedisConfig cấu hình các Bean cần thiết để kết nối và thao tác với bộ nhớ đệm Redis.
 * 
 * 💡 Kiến thức ứng dụng:
 * 1. Java Spring Configuration (@Configuration & @Bean): Khai báo các Bean để Spring IoC Container quản lý.
 * 2. StringRedisTemplate: Lớp tiện ích của Spring Data Redis chuyên dùng cho các khóa/giá trị kiểu String,
 *    giúp đơn giản hóa quá trình serialize/deserialize chuỗi mà không cần cấu hình phức tạp.
 */
@Configuration
public class RedisConfig {

    /**
     * Khởi tạo StringRedisTemplate phục vụ các thao tác đọc/ghi khóa dạng chuỗi.
     * 
     * @param connectionFactory Factory kết nối tự động cấu hình bởi Spring Boot
     * @return StringRedisTemplate
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
