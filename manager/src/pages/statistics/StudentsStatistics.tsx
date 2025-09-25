
import React from 'react';
import { User, University, LineChart, Activity } from 'lucide-react';

// Component imports
import TabSwitcher from './components/TabSwitcher';
import StudentOverviewTab from './components/students/StudentOverviewTab';
import StudentUniversityTab from './components/students/StudentUniversityTab';
import StudentGrowthTab from './components/students/StudentGrowthTab';
import StudentActiveUserTab from './components/students/StudentActiveUserTab';

// Data hooks
import { useStudentData } from './hooks/useStudentData';

const StudentsStatistics = () => {
  const {
    studentsMonthlyData,
    studentsByGender,
    studentsByEducationLevel,
    studentsByOrigin,
    totalStudents,
    totalNewStudents,
    educationDistribution,
    universityDistribution,
    dailyActiveUsers,
    monthlyActiveUsers,
    schoolActiveUsersData,
    totalDailyActive,
    totalMonthlyActive
  } = useStudentData();

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      icon: User,
      content: (
        <StudentOverviewTab
          totalStudents={totalStudents}
          totalNewStudents={totalNewStudents}
          studentsByGender={studentsByGender}
          studentsByOrigin={studentsByOrigin}
        />
      )
    },
    {
      value: "university",
      label: "University",
      icon: University,
      content: (
        <StudentUniversityTab
          universityDistribution={universityDistribution}
          totalStudents={totalStudents}
        />
      )
    },
    {
      value: "growth",
      label: "Growth",
      icon: LineChart,
      content: (
        <StudentGrowthTab
          studentsMonthlyData={studentsMonthlyData}
          totalNewStudents={totalNewStudents}
        />
      )
    },
    {
      value: "active-users",
      label: "Active Users",
      icon: Activity,
      content: (
        <StudentActiveUserTab
          dailyActiveUsers={dailyActiveUsers}
          monthlyActiveUsers={monthlyActiveUsers}
          schoolActiveUsersData={schoolActiveUsersData}
          totalDailyActive={totalDailyActive}
          totalMonthlyActive={totalMonthlyActive}
        />
      )
    }
  ];

  return (
    <div className="space-y-4">
      <TabSwitcher defaultTab="overview" tabs={tabs} />
    </div>
  );
};

export default StudentsStatistics;
