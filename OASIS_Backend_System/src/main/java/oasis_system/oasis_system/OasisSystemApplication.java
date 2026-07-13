package oasis_system.oasis_system;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class OasisSystemApplication {


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
