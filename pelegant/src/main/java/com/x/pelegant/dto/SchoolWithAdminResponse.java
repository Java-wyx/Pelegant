
package com.x.pelegant.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 学校信息响应DTO（包含管理员邮箱）
 */
@Data
public class SchoolWithAdminResponse {

    /**
     * 主键ID
     */
    private String id;

    /**
     * 学校编号
     */
    private String schoolId;

    /**
     * 大学名称
     */
    private String universityName;

    /**
     * 大学类型
     */
    private String universityType;

    /**
     * 大学地址
     */
    private String universityAddress;

    /**
     * 大学网站
     */
    private String universityWebsite;

    /**
     * 大学简介
     */
    private String universityDescription;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    private String status;

    /**
     * 管理员邮箱
     */
    private String adminEmail;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
