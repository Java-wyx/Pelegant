import http from './http';

// 统计数据类型定义
export interface GradeStats {
  grade: string;
  internshipApplications: number;
  fullTimeApplications: number;
  totalApplications: number;
  totalStudents: number;
}

export interface MajorStats {
  major: string;
  internshipApplications: number;
  fullTimeApplications: number;
  totalApplications: number;
  totalStudents: number;
}

export interface CompanyStats {
  companyId: string;
  companyName: string;
  industry: string;
  internshipApplications: number;
  fullTimeApplications: number;
  totalApplications: number;
}

export interface StudentApplicationStatsResponse {
  gradeStats: GradeStats[];
  majorStats: MajorStats[];
  totalApplications: number;
  totalStudents: number;
}

export interface CompanyApplicationStatsResponse {
  companyStats: CompanyStats[];
  totalApplications: number;
  totalCompanies: number;
}

export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Statistics API service
const statisticsApi = {
  // Get student application statistics
  getStudentApplicationStats: async (): Promise<StudentApplicationStatsResponse> => {
    try {
      const response = await http.get<BackendResponse<StudentApplicationStatsResponse>>('/api/teachers/stats/student-applications');
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch student application statistics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student application statistics:', error);
      throw error;
    }
  },

  // Get company application statistics
  getCompanyApplicationStats: async (): Promise<CompanyApplicationStatsResponse> => {
    try {
      const response = await http.get<BackendResponse<CompanyApplicationStatsResponse>>('/api/teachers/stats/company-applications');
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch company application statistics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching company application statistics:', error);
      throw error;
    }
  }
};

export default statisticsApi;
