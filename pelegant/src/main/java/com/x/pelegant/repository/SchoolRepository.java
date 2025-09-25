package com.x.pelegant.repository;

import com.x.pelegant.entity.School;
import com.x.pelegant.vo.ContinentCount;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

/**
 * 学校数据访问接口
 */
@Repository
public interface SchoolRepository extends MongoRepository<School, String> {

    /**
     * 根据学校编号查找学校
     */
    Optional<School> findBySchoolId(String schoolId);

    List<School> findAllBySchoolIdIn(List<String> schoolIds);


    /**
     * 根据大学名称查找学校
     */
    Optional<School> findByUniversityName(String universityName);

    /**
     * 根据大学类型查找学校列表
     */
    List<School> findByUniversityType(String universityType);

    /**
     * 根据状态查找学校列表
     */
    List<School> findByStatus(String status);

    /**
     * 根据大学名称模糊查询
     */
    List<School> findByUniversityNameContaining(String name);

    // 添加正确的方法定义
    @Query(value = "{'$expr': {'$eq': [{'$year': '$createdAt'}, ?0]}}", count = true)
    long countByCreatedAtYear(int year);

    @Aggregation(pipeline = {
            "{ $group: { _id: \"$continent\", count: { $sum: 1 } } }"
    })
    List<ContinentCount> countByContinent();


}