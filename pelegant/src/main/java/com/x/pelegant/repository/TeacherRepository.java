
package com.x.pelegant.repository;

import com.x.pelegant.entity.Teacher;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 教师数据访问接口
 */
@Repository
public interface TeacherRepository extends MongoRepository<Teacher, String> {

    /**
     * 根据邮箱查找教师
     */
    Optional<Teacher> findByEmail(String email);

    /**
     * 根据教师ID查找教师
     */
    Optional<Teacher> findByTeacherId(String teacherId);

    /**
     * 根据邮箱和密码查找教师（用于登录验证）
     */
    Optional<Teacher> findByEmailAndPassword(String email, String password);

    /**
     * 根据角色查找教师列表
     */
    java.util.List<Teacher> findByRole(String role);

    /**
     * 根据学校ID查找教师列表
     */
    java.util.List<Teacher> findBySchoolId(String schoolId);

    boolean existsByRole(String role);
}