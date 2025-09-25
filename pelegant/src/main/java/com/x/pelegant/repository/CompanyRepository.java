package com.x.pelegant.repository;

import com.x.pelegant.entity.Company;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Optional;
import java.util.List;

/**
 * 企业数据访问接口
 */
@Repository
public interface CompanyRepository extends MongoRepository<Company, String> {

    /**
     * 根据企业编号查找企业
     */
    Optional<Company> findByCompanyId(String companyId);

    List<Company> findAll();
    /**
     * 根据企业名称查找企业
     */
    Optional<Company> findByCompanyName(String companyName);

    /**
     * 根据行业查找企业列表
     */
    List<Company> findByIndustry(String industry);

    /**
     * 根据企业类型查找企业列表
     */
    List<Company> findByCompanyType(String companyType);

    /**
     * 根据状态查找企业列表
     */
    List<Company> findByStatus(String status);

    /**
     * 根据企业名称模糊查询
     */
    List<Company> findByCompanyNameContaining(String name);

    /**
     * 根据状态统计企业数量
     */
    long countByStatus(String status);

    /**
     * 根据行业统计企业数量
     */
    long countByIndustry(String industry);

    /**
     * 根据企业类型统计企业数量
     */
    long countByCompanyType(String companyType);


    Optional<Company> findByCompanyNameStartingWithIgnoreCase(String prefix);

    Optional<Company> findByCompanyNameLower(String companyNameLower);

    Optional<Company> findFirstByCompanyNameLowerRegex(String regex);

    Optional<Company> findFirstByCompanyNameLowerStartingWithIgnoreCase(String prefix);

    Optional<Company> findByCompanyNameIgnoreCase(String companyName);

    List<Company> findByCompanyIdIn(List<String> companyIds);
    List<Company> findByIdIn(List<String> ids);
}