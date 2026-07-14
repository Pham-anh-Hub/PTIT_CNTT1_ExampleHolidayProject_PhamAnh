package oasis_system.oasis_system.core.exception;

/**
 * Ngoại lệ ném ra khi Token JWT (Access Token hoặc Refresh Token) không hợp lệ hoặc hết hạn.
 */
public class TokenInvalidException extends RuntimeException {

    public TokenInvalidException(String message) {
        super(message);
    }
}
