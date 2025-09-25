package com.x.pelegant.repository;

import com.x.pelegant.entity.PRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * 项目管理角色权限数据访问接口
 */
@Repository
public interface PRoleRepository extends MongoRepository<PRole, String> {

    /**
     * 根据角色名称查找角色
     */
    Optional<PRole> findByRoleName(String roleName);

    /**
     * 根据角色名称模糊查询
     */
    List<PRole> findByRoleNameContaining(String roleName);

    /**
     * 根据权限查找角色列表
     */
    List<PRole> findByPermissionsContaining(String permission);

    /**
     * 检查角色名称是否存在（排除指定ID）
     */
    boolean existsByRoleNameAndIdNot(String roleName, String id);

    /**
     * 检查角色名称是否存在
     */
    boolean existsByRoleName(String roleName);
}
