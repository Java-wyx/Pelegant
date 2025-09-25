package com.x.pelegant.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
@Data
@Document(collection = "student_activity")
public class StudentActivity {
    @Id
    private String id;
    private String studentId;
    private String activityType;
    private LocalDateTime createdAt;

    // getters & setters
}
