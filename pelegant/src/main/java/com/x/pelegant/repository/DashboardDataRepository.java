package com.x.pelegant.repository;


import com.x.pelegant.entity.DashboardData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface DashboardDataRepository extends MongoRepository<DashboardData, String> {

    DashboardData findByCreatedAt(LocalDate today);
}
