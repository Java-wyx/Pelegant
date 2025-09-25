/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-08 15:05:02
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-08 15:39:05
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\repository\JobRepository.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.repository;

import com.x.pelegant.entity.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;
import java.util.List;

/**
 * 职位数据访问接口
 */
@Repository
public interface JobRepository extends MongoRepository<Job, String> {

    /**
     * 根据职位编号查找职位
     */
    Optional<Job> findByJobId(String jobId);

    Optional<Job> findById(String jobId);




    List<Job> findAllByUniqueKeyIn(Collection<String> keys);

    boolean existsByJobTitleAndCompanyName(String jobTitle, String companyName);


    /**
     * 根据企业ID查找职位列表
     */
    List<Job> findByCompanyId(String companyId);

    /**
     * 根据职位类型查找职位列表
     */
    List<Job> findByJobType(String jobType);

    /**
     * 根据工作地点查找职位列表
     */
    List<Job> findByWorkLocation(String workLocation);

    /**
     * 根据状态查找职位列表
     */
    List<Job> findByStatus(String status);

    /**
     * 根据职位名称模糊查询
     */
    List<Job> findByJobTitleContaining(String title);

    /**
     * 根据企业名称查找职位列表
     */
    List<Job> findByCompanyName(String companyName);

    /**
     * 根据职位标题查找职位
     */
    Optional<Job> findByJobTitle(String jobTitle);

    /**
     * 根据企业名称和职位标题查找职位
     */
    Optional<Job> findByCompanyNameAndJobTitle(String companyName, String jobTitle);



    Optional<Job> findFirstByCompanyIdAndJobTitleIgnoreCase(String companyId, String jobTitle);

    List<Job> findAllByJobIdIn(List<String> jobIds);


    List<Job> findByJobIdIn(List<String> jobIds);
    List<Job> findByIdIn(List<String> Ids);

    String id(String id);
}