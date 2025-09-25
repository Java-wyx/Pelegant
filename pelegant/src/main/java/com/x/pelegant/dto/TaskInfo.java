package com.x.pelegant.dto;

import com.x.pelegant.entity.CrawlerData;

import java.util.List;

public class TaskInfo {

    private String taskKey;
    private Long ttlSeconds;
    private List<CrawlerData> dataList;

    // 无参构造
    public TaskInfo() {}

    // 全参构造
    public TaskInfo(String taskKey, Long ttlSeconds, List<CrawlerData> dataList) {
        this.taskKey = taskKey;
        this.ttlSeconds = ttlSeconds;
        this.dataList = dataList;
    }

    // Getter & Setter
    public String getTaskKey() {
        return taskKey;
    }

    public void setTaskKey(String taskKey) {
        this.taskKey = taskKey;
    }

    public Long getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(Long ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }

    public List<CrawlerData> getDataList() {
        return dataList;
    }

    public void setDataList(List<CrawlerData> dataList) {
        this.dataList = dataList;
    }

    @Override
    public String toString() {
        return "TaskInfo{" +
                "taskKey='" + taskKey + '\'' +
                ", ttlSeconds=" + ttlSeconds +
                ", dataList=" + dataList +
                '}';
    }
}
