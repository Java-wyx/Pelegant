package com.x.pelegant.dto;

import java.util.List;
import java.util.Map;

public class StudentStatisticsResponse {
    private long totalStudents;
    private long totalNewStudents;
    private Map<String, Long> studentsByGender;
    private List<OriginDTO> studentsByOrigin;
    private List<
            DailyActiveDTO> dailyActiveUsersWeek;
    private List<MonthlyActiveDTO> monthlyActiveUsers6Months;

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getTotalNewStudents() { return totalNewStudents; }
    public void setTotalNewStudents(long totalNewStudents) { this.totalNewStudents = totalNewStudents; }

    public Map<String, Long> getStudentsByGender() { return studentsByGender; }
    public void setStudentsByGender(Map<String, Long> studentsByGender) { this.studentsByGender = studentsByGender; }

    public List<OriginDTO> getStudentsByOrigin() { return studentsByOrigin; }
    public void setStudentsByOrigin(List<OriginDTO> studentsByOrigin) { this.studentsByOrigin = studentsByOrigin; }

    public List<DailyActiveDTO> getDailyActiveUsersWeek() { return dailyActiveUsersWeek; }
    public void setDailyActiveUsersWeek(List<DailyActiveDTO> dailyActiveUsersWeek) { this.dailyActiveUsersWeek = dailyActiveUsersWeek; }

    public List<MonthlyActiveDTO> getMonthlyActiveUsers6Months() { return monthlyActiveUsers6Months; }
    public void setMonthlyActiveUsers6Months(List<MonthlyActiveDTO> monthlyActiveUsers6Months) { this.monthlyActiveUsers6Months = monthlyActiveUsers6Months; }
}
