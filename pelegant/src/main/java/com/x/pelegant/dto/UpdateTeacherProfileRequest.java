package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * 教师修改个人信息请求DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateTeacherProfileRequest {

    /**
     * 教师姓名
     */
    @NotBlank(message = "教师姓名不能为空")
    private String name;

    /**
     * 头像文件路径（可选）
     */
    private String avatarPath;
}
