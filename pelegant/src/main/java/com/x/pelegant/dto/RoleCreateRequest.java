package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 角色权限创建请求DTO
 */
@Data
public class RoleCreateRequest {

    /**
     * 角色名称
     */
    @NotBlank(message = "角色名称不能为空")
    @Size(max = 100, message = "角色名称不能超过100字符")
    private String roleName;

    /**
     * 角色描述
     */
    @NotBlank(message = "角色描述不能为空")
    @Size(max = 500, message = "角色描述不能超过500字符")
    private String description;

    /**
     * 权限列表
     */
    @NotEmpty(message = "权限列表不能为空")
    private List<String> permissions;

    /**
     * 是否为系统角色
     */
    private Boolean isSystem = false;
}
