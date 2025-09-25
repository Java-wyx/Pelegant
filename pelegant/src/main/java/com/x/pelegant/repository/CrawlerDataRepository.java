package com.x.pelegant.repository;

import com.x.pelegant.entity.CrawlerData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 爬虫数据Repository
 */
@Repository
public interface CrawlerDataRepository extends MongoRepository<CrawlerData, String> {

    /**
     * 根据数据类型查询
     */
    List<CrawlerData> findByDataType(String dataType);

    /**
     * 根据爬虫名称查询
     */
    List<CrawlerData> findByCrawlerName(String crawlerName);

    /**
     * 根据批次ID查询
     */
    List<CrawlerData> findByBatchId(String batchId);

    /**
     * 根据状态查询
     */
    List<CrawlerData> findByStatus(String status);

    /**
     * 根据数据类型和爬虫名称查询
     */
    List<CrawlerData> findByDataTypeAndCrawlerName(String dataType, String crawlerName);

    /**
     * 根据数据类型和状态查询
     */
    List<CrawlerData> findByDataTypeAndStatus(String dataType, String status);

    /**
     * 根据时间范围查询
     */
    List<CrawlerData> findByImportTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据数据类型和时间范围查询
     */
    List<CrawlerData> findByDataTypeAndImportTimeBetween(String dataType, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查询指定数据类型的最新数据
     */
    @Query("{'dataType': ?0}")
    List<CrawlerData> findLatestByDataType(String dataType);

    /**
     * 根据原始数据中的特定字段查询（用于去重）
     */
    @Query("{'rawData.?0': ?1}")
    Optional<CrawlerData> findByRawDataField(String fieldName, Object fieldValue);

    /**
     * 统计指定数据类型的数据条数
     */
    long countByDataType(String dataType);

    /**
     * 统计指定状态的数据条数
     */
    long countByStatus(String status);

    /**
     * 删除指定时间之前的数据（用于数据清理）
     */
    void deleteByImportTimeBefore(LocalDateTime cutoffTime);
}
