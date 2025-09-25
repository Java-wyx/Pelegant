
package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

import java.util.List;
import java.util.ArrayList;

/**
 * 学生实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "student")
public class Student extends BaseEntity {


    /**
     * 学生姓名
     */
    @NotBlank(message = "姓名不能为空")
    @Field("fullName")
    private String fullName;

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Indexed(unique = true)
    @Field("email")
    private String email;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Field("password")
    private String password;

    /**
     * 学号
     */
    @NotBlank(message = "学号不能为空")
    @Pattern(regexp = "^\\d{10}$", message = "学号必须是10位数字")
    @Indexed(unique = true)
    @Field("studentId")
    private String studentId;

    /**
     * 入学年份
     */
    @Field("enrollmentYear")
    private Integer enrollmentYear;

    /**
     * 专业
     */
    @NotBlank(message = "专业不能为空")
    @Field("major")
    private String major;

    /**
     * 学校ID
     */
    @NotBlank(message = "学校ID不能为空")
    @Field(name = "schoolid")
    private String schoolId;

    /**
     * 昵称
     */
    @Field("nickname")
    private String nickname;

    /**
     * 性别：Male-男性，Female-女性，Other-其他
     */
    @Field("gender")
    private String gender;

    /**
     * 头像文件路径
     */
    @Field("avatarPath")
    private String avatarPath;

    /**
     * 简历文件路径
     */
    @Field("resumePath")
    private String resumePath;

    /**
     * 个人简介
     */
    @Field("bio")
    private String bio;

    /**
     * 账户状态：active-活跃，inactive-非活跃
     */
    @Field("status")
    private String status = "active";

    /**
     * 收藏的工作编号列表
     */
    @Field("bookmarkedJobs")
    private List<String> bookmarkedJobs = new ArrayList<>();

    /**
     * 申请的工作编号列表
     */
    @Field("appliedJobs")
    private List<String> appliedJobs = new ArrayList<>();

    /**
     * 是否首次登录：true-首次登录需要修改密码和完善资料，false-已完成初始设置
     */
    @Field("isFirstLogin")
    private Boolean isFirstLogin = true;

    /**
     * 是否已修改初始密码：true-已修改，false-未修改
     */
    @Field("hasChangedPassword")
    private Boolean hasChangedPassword = false;

    /**
     * 是否已完成个人资料设置：true-已完成，false-未完成
     */
    @Field("hasCompletedProfile")
    private Boolean hasCompletedProfile = false;
    /**
     * 是否是研究生
     */

    @Field("ismaster")
    private Boolean isMaster ;
    /**
     * 是否是博士生
     */
    @Field("isphd")
    private Boolean isPhd ;

    private String studentType;
}