
package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.Min;

/**
 * 学生个人信息更新请求DTO
 */
@Data
public class StudentProfileUpdateRequest {

    /**
     * 学生姓名
     */
    private String fullName;

    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 专业
     */
    private String major;

    /**
     * 入学年份
     */
    @Min(value = 1900, message = "入学年份不能早于1900年")
    private Integer enrollmentYear;

    /**
     * 学校ID
     */
    private String schoolId;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 性别：Male-男性，Female-女性，Other-其他
     */
    private String gender;

    /**
     * 个人简介
     */
    private String bio;

    /**
     * 账户状态：active-活跃，inactive-非活跃
     */
    private String status;
}