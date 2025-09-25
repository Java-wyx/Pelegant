
package com.x.pelegant.repository;

import com.x.pelegant.entity.ResumeData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 简历解析数据Repository
 */
@Repository
public interface ResumeDataRepository extends MongoRepository<ResumeData, String> {

    /**
     * 根据学生ID查找最新的简历解析数据
     */
    @Query(value = "{ 'studentId' : ?0 }", sort = "{ 'createdAt' : -1 }")
    Optional<ResumeData> findTopByStudentIdOrderByCreatedAtDesc(String studentId);

    /**
     * 根据学生ID查找所有简历解析数据
     */
    List<ResumeData> findByStudentId(String studentId);

    /**
     * 根据学生ID和简历路径查找简历解析数据
     */
    Optional<ResumeData> findByStudentIdAndResumePath(String studentId, String resumePath);

    /**
     * 根据Coze工作流日志ID查找简历解析数据
     */
    Optional<ResumeData> findByLogId(String logId);

    /**
     * 删除学生的所有简历解析数据
     */
    void deleteByStudentId(String studentId);

    Optional<ResumeData> findTopByStudentIdOrderByUpdateTimeDesc(String studentId);
}