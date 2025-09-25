package com.x.pelegant.dto;

import com.x.pelegant.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import java.util.ArrayList;
import java.util.List;

@Data
public class StudentDTO {


        private String fullName;


        private String email;


        private String password;


        private String studentId;

        private Integer enrollmentYear;


        private String major;


        private String schoolId;

        private String nickname;


        private String gender;

        private String avatarPath;


        private String resumePath;


        private String bio;


        private String status = "active";


        private List<String> bookmarkedJobs = new ArrayList<>();


        private List<String> appliedJobs = new ArrayList<>();


        private Boolean isFirstLogin = true;


        private Boolean hasChangedPassword = false;


        private Boolean hasCompletedProfile = false;

        private String university ;

}
