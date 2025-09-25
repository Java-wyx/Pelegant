package com.x.pelegant.vo;

public class TaskDetails {
    private String taskId;
    private String deduplicationSource;

    // Getters and Setters
    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getDeduplicationSource() {
        return deduplicationSource;
    }

    public void setDeduplicationSource(String deduplicationSource) {
        this.deduplicationSource = deduplicationSource;
    }
}
