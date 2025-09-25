package com.x.pelegant.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "DashboardData")
public class DashboardData {
    @Id
    private String id;
    @Field("totalStudents")
    private Integer totalStudents;

    @Field("totalJobs")
    private Integer totalJobs;

    @Field("totalCompanies")
    private Integer totalCompanies;

    @Field("totalSchools")
    private Integer totalSchools;

    @Field("createdAt")
    @JsonFormat(pattern = "yyyy-MM-dd")  // 只显示年月日
    private LocalDate createdAt;

}
