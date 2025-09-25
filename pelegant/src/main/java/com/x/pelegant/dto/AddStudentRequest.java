
package com.x.pelegant.dto;

import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

/**
 * 教师添加学生请求DTO
 */
@Data
public class AddStudentRequest {
    /**
     * 学生姓名
     */
    @NotBlank(message = "姓名不能为空")
    private String fullName;

    /**
     * 学号
     */
    @NotBlank(message = "学号不能为空")
    @Pattern(regexp = "^\\d{10}$", message = "学号必须是10位数字")
    private String studentId;

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 学科/专业
     */
    @NotBlank(message = "学科不能为空")
    private String major;

    /**
     * 入学年份
     */
    @NotNull(message = "入学年份不能为空")
    private Integer enrollmentYear;

    /**
     * 是否是研究生
     */
    private Boolean isMaster;
    /**
     * 是否是博士生
     */
    private Boolean isPhd;

}