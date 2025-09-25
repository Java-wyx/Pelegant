package com.x.pelegant.dto;

import com.x.pelegant.entity.Student;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 包含学校信息的学生响应DTO
 */
@Data
public class StudentWithSchoolResponse {

    /**
     * 学生ID
     */
    private String id;

    /**
     * 学生姓名
     */
    private String fullName;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 学号
     */
    private String studentId;

    /**
     * 入学年份
     */
    private Integer enrollmentYear;

    /**
     * 专业
     */
    private String major;

    /**
     * 学校ID
     */
    private String schoolId;

    /**
     * 学校名称
     */
    private String schoolName;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 性别
     */
    private String gender;

    /**
     * 头像文件路径
     */
    private String avatarPath;

    /**
     * 简历文件路径
     */
    private String resumePath;

    /**
     * 个人简介
     */
    private String bio;

    /**
     * 账户状态
     */
    private String status;

    /**
     * 收藏的工作编号列表
     */
    private List<String> bookmarkedJobs;

    /**
     * 申请的工作编号列表
     */
    private List<String> appliedJobs;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 是否激活
     */
    private Boolean isFirstLogin;

    /**
     * 从Student实体创建响应对象
     */
    public static StudentWithSchoolResponse fromStudent(Student student, String schoolName) {
        StudentWithSchoolResponse response = new StudentWithSchoolResponse();
        response.setId(student.getId());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setStudentId(student.getStudentId());
        response.setEnrollmentYear(student.getEnrollmentYear());
        response.setMajor(student.getMajor());
        response.setSchoolId(student.getSchoolId());
        response.setSchoolName(schoolName);
        response.setNickname(student.getNickname());
        response.setGender(student.getGender());
        response.setAvatarPath(student.getAvatarPath());
        response.setResumePath(student.getResumePath());
        response.setBio(student.getBio());
        response.setStatus(student.getStatus());
        response.setBookmarkedJobs(student.getBookmarkedJobs());
        response.setAppliedJobs(student.getAppliedJobs());
        response.setCreateTime(student.getCreateTime());
        response.setUpdateTime(student.getUpdateTime());
        response.setIsFirstLogin(student.getIsFirstLogin());
        return response;
    }
}
