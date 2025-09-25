package com.x.pelegant.common;

import lombok.Data;

/**
 * 通用响应类
 */
@Data
public class Result<T> {
    private boolean success;
    private String message;
    private String msg;
    private T data;
    private Long total;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setData(data);
        return result;
    }

    public static <T> Result<T> fail(String msg, T data) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setMsg(msg);
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success(T data, String message) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setData(data);
        result.setMessage(message);
        return result;
    }

    public static <T> Result<T> success(T data, Long total) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setData(data);
        result.setTotal(total);
        return result;
    }

    public static <T> Result<T> fail(String message) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setMessage(message);
        return result;
    }


}