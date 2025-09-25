package com.x.pelegant.exception;

/**
 * JWT相关异常类
 */
public class JwtException extends RuntimeException {

    public JwtException(String message) {
        super(message);
    }

    public JwtException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Token无效异常
     */
    public static class InvalidTokenException extends JwtException {
        public InvalidTokenException(String message) {
            super(message);
        }
    }

    /**
     * Token过期异常
     */
    public static class TokenExpiredException extends JwtException {
        public TokenExpiredException(String message) {
            super(message);
        }
    }

    /**
     * Token缺失异常
     */
    public static class TokenMissingException extends JwtException {
        public TokenMissingException(String message) {
            super(message);
        }
    }

    /**
     * 角色不匹配异常
     */
    public static class RoleMismatchException extends JwtException {
        public RoleMismatchException(String message) {
            super(message);
        }
    }

    /**
     * 未授权异常
     */
    public static class UnauthorizedException extends JwtException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
