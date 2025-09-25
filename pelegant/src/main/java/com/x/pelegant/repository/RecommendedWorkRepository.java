package com.x.pelegant.repository;

import com.x.pelegant.entity.RecommendedWork;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 推荐工作数据访问接口
 */
@Repository
public interface RecommendedWorkRepository extends MongoRepository<RecommendedWork, String> {

    /**
     * 根据学生ID查找推荐工作列表
     */
    List<RecommendedWork> findByStudentId(String studentId);


    /**
     * 根据学生ID和公司名查找推荐工作
     */
    Optional<RecommendedWork> findByStudentIdAndCompanyName(String studentId, String companyName);

    /**
     * 根据学生ID和职位标题查找推荐工作
     */
    Optional<RecommendedWork> findByStudentIdAndJobTitle(String studentId, String jobTitle);

    /**
     * 根据学生ID、公司名和职位标题查找推荐工作
     */
    Optional<RecommendedWork> findByStudentIdAndCompanyNameAndJobTitle(String studentId, String companyName,
                                                                       String jobTitle);

    /**
     * 统计学生的推荐工作数量
     */
    long countByStudentId(String studentId);

    /**
     * 删除学生的所有推荐工作
     */
    void deleteByStudentId(String studentId);

    Optional<RecommendedWork> findByJobId(String jobId);

   List<RecommendedWork> findByJobIdIn(List<String> jobIds);


    boolean existsByStudentId(String studentId);


}
