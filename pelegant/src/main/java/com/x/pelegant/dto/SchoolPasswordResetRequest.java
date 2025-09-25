package com.x.pelegant.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 学校管理员密码重置请求DTO
 */
@Data
public class SchoolPasswordResetRequest {

    /**
     * 学校ID列表（批量重置时使用）
     */
    private List<String> schoolIds;

    /**
     * 单个学校ID（单个重置时使用）
     */
    private String schoolId;

    /**
     * 是否为批量操作
     */
    private boolean batchOperation = false;

    /**
     * 重置类型：reset（重置密码）或 initial（设置初始密码）
     */
    @NotBlank(message = "重置类型不能为空")
    private String resetType = "reset";

    /**
     * 验证请求数据
     */
    public boolean isValid() {
        if (batchOperation) {
            return schoolIds != null && !schoolIds.isEmpty();
        } else {
            return schoolId != null && !schoolId.trim().isEmpty();
        }
    }
}
