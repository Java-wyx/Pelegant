package com.x.pelegant.repository;

import com.x.pelegant.entity.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * 项目管理员数据访问接口
 */
@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {

    /**
     * 根据邮箱查找项目管理员
     */
    Optional<Project> findByEmail(String email);

    /**
     * 根据邮箱和密码查找项目管理员（用于登录验证）
     */
    Optional<Project> findByEmailAndPassword(String email, String password);

    /**
     * 根据部门查找项目管理员列表
     */
    List<Project> findByDepartment(String department);

    /**
     * 根据角色查找项目管理员列表
     */
    List<Project> findByRole(String role);

    /**
     * 根据状态查找项目管理员列表
     */
    List<Project> findByStatus(String status);
}