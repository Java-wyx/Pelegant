/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-08 17:23:05
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-08 18:04:07
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\entity\RecommendedWork.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.NotBlank;

/**
 * 推荐工作实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "recommendedwork")
public class RecommendedWork {

    /**
     * 主键ID
     */
    @Id
    private String id;

    @Field("jobKey")
    private String jobKey;

    /**
     * 学生ID（推荐给哪个学生）
     */
    @NotBlank(message = "学生ID不能为空")
    @Indexed
    @Field("studentId")
    private String studentId;

    /**
     * 公司名称
     */
    @NotBlank(message = "公司名称不能为空")
    @Field("companyName")
    private String companyName;


    @Field("logoImage")
    private String logoImage;


    /**
     * 职位标题
     */
    @NotBlank(message = "职位标题不能为空")
    @Field("jobTitle")
    private String jobTitle;

    /**
     * 对应的真实职位ID（如果在Job表中存在的话）
     */
    @Field("jobId")
    private String jobId;

    /**
     * 对应的真实公司ID（如果在Company表中存在的话）
     */
    @Field("companyId")
    private String companyId;

    @Field("insertTime")
    private String insertTime;
    @Field("history")
    private String history;
}
