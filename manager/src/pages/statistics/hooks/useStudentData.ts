
// Student data utility hooks

// Sample student data
const studentsMonthlyData = [
  { name: '一月', value: 132 },
  { name: '二月', value: 89 },
  { name: '三月', value: 111 },
  { name: '四月', value: 125 },
  { name: '五月', value: 156 },
  { name: '六月', value: 140 },
  { name: '七月', value: 98 },
  { name: '八月', value: 87 },
  { name: '九月', value: 142 },
  { name: '十月', value: 119 },
  { name: '十一月', value: 123 },
  { name: '十二月', value: 92 },
];

const studentsByGender = {
  male: 690,
  female: 724,
};

const studentsByEducationLevel = [
  { name: 'High School', value: 386 },
  { name: 'Bachelor', value: 721 },
  { name: 'Master', value: 285 },
  { name: 'PhD', value: 22 },
];

const studentsBySchoolType = [
  { name: 'Public School', value: 823 },
  { name: 'Private School', value: 486 },
  { name: 'International School', value: 105 },
];

const studentsByOrigin = [
  { name: 'Asia', value: 578, fill: '#0088FE' },
  { name: 'Europe', value: 423, fill: '#00C49F' },
  { name: 'North America', value: 245, fill: '#FFBB28' },
  { name: 'Oceania', value: 104, fill: '#FF8042' },
  { name: 'Africa', value: 42, fill: '#8884d8' },
  { name: 'South America', value: 22, fill: '#82ca9d' },
];

// University distribution data by continent
const universityDistributionData = [
  { continent: 'Asia', countries: 14, schools: 98, students: 578 },
  { continent: 'Europe', countries: 21, schools: 72, students: 423 },
  { continent: 'North America', countries: 3, schools: 43, students: 245 },
  { continent: 'Oceania', countries: 4, schools: 19, students: 104 },
  { continent: 'Africa', countries: 7, schools: 8, students: 42 },
  { continent: 'South America', countries: 6, schools: 3, students: 22 },
];

// Daily active users data
const dailyActiveUsers = [
  { name: '周一', value: 2345 },
  { name: '周二', value: 2563 },
  { name: '周三', value: 2798 },
  { name: '周四', value: 2642 },
  { name: '周五', value: 2405 },
  { name: '周六', value: 1825 },
  { name: '周日', value: 1621 },
];

// Monthly active users data
const monthlyActiveUsers = [
  { name: '一月', value: 5324 },
  { name: '二月', value: 5647 },
  { name: '三月', value: 6105 },
  { name: '四月', value: 6342 },
  { name: '五月', value: 6521 },
  { name: '六月', value: 6732 },
  { name: '七月', value: 6845 },
  { name: '八月', value: 6923 },
  { name: '九月', value: 7102 },
  { name: '十月', value: 7256 },
  { name: '十一月', value: 7425 },
  { name: '十二月', value: 7612 },
];

// School active users data
const schoolActiveUsersData = [
  {
    school: '北京大学',
    dailyActive: 345,
    monthlyActive: 1250,
  },
  {
    school: '清华大学',
    dailyActive: 323,
    monthlyActive: 1178,
  },
  {
    school: '复旦大学',
    dailyActive: 287,
    monthlyActive: 1042,
  },
  {
    school: '上海交通大学',
    dailyActive: 276,
    monthlyActive: 986,
  },
  {
    school: '浙江大学',
    dailyActive: 265,
    monthlyActive: 954,
  },
  {
    school: '南京大学',
    dailyActive: 234,
    monthlyActive: 876,
  },
  {
    school: '中国人民大学',
    dailyActive: 212,
    monthlyActive: 798,
  },
  {
    school: '武汉大学',
    dailyActive: 198,
    monthlyActive: 765,
  },
  {
    school: '哈尔滨工业大学',
    dailyActive: 187,
    monthlyActive: 732,
  },
  {
    school: '西安交通大学',
    dailyActive: 173,
    monthlyActive: 654,
  },
];

// Get total number of students
const getTotalStudents = () => {
  return studentsByGender.male + studentsByGender.female;
};

// Calculate total new students added this year
const getTotalNewStudents = () => {
  return studentsMonthlyData.reduce((total, item) => total + item.value, 0);
};

export const useStudentData = () => {
  // Calculate totals
  const totalStudents = getTotalStudents();
  const totalNewStudents = getTotalNewStudents();
  
  // Create statistics data for education distribution
  const educationDistribution = studentsBySchoolType.map(type => ({
    type: type.name,
    students: type.value,
    percentage: Math.round((type.value / totalStudents) * 100)
  }));

  // Calculate total daily and monthly active users
  const totalDailyActive = schoolActiveUsersData.reduce((sum, school) => sum + school.dailyActive, 0);
  const totalMonthlyActive = schoolActiveUsersData.reduce((sum, school) => sum + school.monthlyActive, 0);

  return {
    studentsMonthlyData,
    studentsByGender,
    studentsByEducationLevel,
    studentsByOrigin,
    totalStudents,
    totalNewStudents,
    educationDistribution,
    universityDistribution: universityDistributionData,
    dailyActiveUsers,
    monthlyActiveUsers,
    schoolActiveUsersData,
    totalDailyActive,
    totalMonthlyActive
  };
};
