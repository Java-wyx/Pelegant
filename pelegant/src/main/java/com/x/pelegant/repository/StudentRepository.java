
package com.x.pelegant.repository;

import com.x.pelegant.dto.StudentOriginCount;
import com.x.pelegant.entity.Student;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

/**
 * 学生数据访问接口
 */
@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    /**
     * 根据id查找学生
     */
    Optional<Student> findById(String id);

    /**
     * 根据邮箱查找学生
     */
    Optional<Student> findByEmail(String email);

    /**
     * 根据学号查找学生
     */
    Optional<Student> findByStudentId(String studentId);

    /**
     * 根据专业查找学生列表
     */
    List<Student> findByMajor(String major);

    /**
     * 根据入学年份查找学生列表
     */
    List<Student> findByEnrollmentYear(Integer enrollmentYear);

    /**
     * 根据姓名模糊查询学生
     */
    List<Student> findByFullNameContaining(String fullName);

    /**
     * 根据邮箱和密码查找学生（用于登录验证）
     */
    Optional<Student> findByEmailAndPassword(String email, String password);

    /**
     * 根据学校ID查找学生列表
     */
    List<Student> findBySchoolId(String schoolId);

    /**
     * 根据性别查找学生列表
     */
    List<Student> findByGender(String gender);

    /**
     * 根据账户状态查找学生列表
     */
    List<Student> findByStatus(String status);

    /**
     * 根据昵称查找学生
     */
    Optional<Student> findByNickname(String nickname);

    /**
     * 查找有简历的学生
     */
    List<Student> findByResumePathIsNotNull();

    /**
     * 查找有头像的学生
     */
    List<Student> findByAvatarPathIsNotNull();

    /**
     * 根据专业和学校ID查找学生
     */
    List<Student> findByMajorAndSchoolId(String major, String schoolId);

    /**
     * 统计学校学生数量
     */
    long countBySchoolId(String schoolId);

    /**
     * 统计专业学生数量
     */
    long countByMajor(String major);

    /**
     * 根据入学年份和学校ID查找学生
     */
    List<Student> findByEnrollmentYearAndSchoolId(Integer enrollmentYear, String schoolId);

    /**
     * 根据学校ID和状态查找学生列表
     */
    List<Student> findBySchoolIdAndStatus(String schoolId, String status);

    List<Student> findByStudentIdStartingWith(String prefix);

    Optional<Student> findByStudentIdAndSchoolId(String studentId, String schoolId);

    List<Student> findByBookmarkedJobsContainsOrAppliedJobsContains(String jobId1, String jobId2);

    @Query("{'createdAt': {$gte: ?0, $lt: ?1}}")
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // 或者使用默认方法实现
    @Query("{ '$expr': { '$eq': [{ '$year': '$createdAt' }, ?0] } }")
    Long countByCreatedAtYear(int year);


    long countByGender(String gender);
    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$origin', 'count': { '$sum': 1 } } }"
    })
    List<StudentOriginCount> countByOrigin();



}