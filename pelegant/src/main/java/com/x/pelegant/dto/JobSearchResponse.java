package com.x.pelegant.dto;

import com.x.pelegant.entity.Job;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 职位搜索响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobSearchResponse {

    /**
     * 职位列表
     */
    private List<Job> list;

    /**
     * 总数量
     */
    private long total;
}
