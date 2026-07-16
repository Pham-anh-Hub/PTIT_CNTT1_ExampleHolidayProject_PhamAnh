package oasis_system.oasis_system;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class OasisSystemApplication {

    static {
        try {
            java.io.File envFile = new java.io.File(".env");
            if (!envFile.exists()) {
                envFile = new java.io.File("OASIS_Backend_System/.env");
            }
            if (envFile.exists()) {
                java.nio.file.Files.lines(envFile.toPath())
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
                    .forEach(line -> {
                        int index = line.indexOf("=");
                        String key = line.substring(0, index).trim();
                        String value = line.substring(index + 1).trim();
                        System.setProperty(key, value);
                    });
                System.out.println(">>> Da nap thanh cong cac bien moi truong tu tep .env tai: " + envFile.getAbsolutePath());
            } else {
                System.err.println(">>> Canh bao: Khong tim thay tep .env tai thu muc hien tai hoac OASIS_Backend_System/");
            }
        } catch (Exception e) {
            System.err.println(">>> Loi khi tai tep .env: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(OasisSystemApplication.class, args);
    }
    @Bean
    public CommandLineRunner runner(PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println(passwordEncoder.encode("12345678"));
        };
    }
}
