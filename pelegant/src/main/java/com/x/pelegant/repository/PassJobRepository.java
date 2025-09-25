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
import com.x.pelegant.entity.PassJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.List;

/**
 * 职位数据访问接口
 */
@Repository
public interface PassJobRepository extends MongoRepository<PassJob, String> {

    /**
     * 根据职位编号查找职位
     */


    Optional<PassJob> findById(String id);


    List<PassJob> findAll();






}