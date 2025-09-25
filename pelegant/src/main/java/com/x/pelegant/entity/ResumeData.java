package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Map;

/**
 * 简历解析数据实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "resume")
public class ResumeData extends BaseEntity {

    /**
     * 学生ID
     */
    @Field("studentId")
    private String studentId;

    /**
     * 简历文件路径
     */
    @Field("resumePath")
    private String resumePath;

    /**
     * 解析状态：pending-解析中，success-成功，failed-失败
     */
    @Field("parseStatus")
    private String parseStatus = "pending";

    /**
     * 解析错误信息
     */
    @Field("errorMessage")
    private String errorMessage;

    /**
     * Coze工作流日志ID
     */
    @Field("logId")
    private String logId;

    /**
     * 解析后的完整数据（JSON格式存储）
     */
    @Field("data")
    private Map<String, Object> data;

    /**
     * 获奖列表
     */
    @Field("awardList")
    private List<Map<String, Object>> awardList;

    /**
     * 邮箱
     */
    @Field("email")
    private String email;

    /**
     * 性别
     */
    @Field("gender")
    private String gender;

    /**
     * 姓名
     */
    @Field("name")
    private String name;

    /**
     * 手机号
     */
    @Field("mobile")
    private String mobile;

    /**
     * 教育经历列表
     */
    @Field("educationList")
    private List<Map<String, Object>> educationList;

    /**
     * 工作经历列表
     */
    @Field("workExperienceList")
    private List<Map<String, Object>> workExperienceList;

    /**
     * 项目经历列表
     */
    @Field("projectList")
    private List<Map<String, Object>> projectList;

    /**
     * 技能列表
     */
    @Field("skillList")
    private List<String> skillList;

    /**
     * 自我评价
     */
    @Field("selfEvaluation")
    private String selfEvaluation;
}