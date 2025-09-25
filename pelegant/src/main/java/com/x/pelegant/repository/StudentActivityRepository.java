package com.x.pelegant.repository;

import com.x.pelegant.entity.StudentActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudentActivityRepository extends MongoRepository<StudentActivity, String> {

    List<StudentActivity> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countDistinctStudentByCreatedAtBetween(LocalDateTime start, LocalDateTime end);


}
