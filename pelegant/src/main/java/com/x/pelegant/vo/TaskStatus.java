package com.x.pelegant.vo;

import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "task_status")
public class TaskStatus {
    private String taskId;
    private String status; // "pending", "completed", "failed"
    private String result; // JSON string of the task result
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TaskStatus() {
    }

    public TaskStatus(String taskId, String status, String result) {
        this.taskId = taskId;
        this.status = status;
        this.result = result;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}