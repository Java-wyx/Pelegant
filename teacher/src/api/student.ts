// Modified: student.ts
import http from './http';

// Student interface - 匹配后端Student实体
export interface Student {
  id?: string; // 后端使用MongoDB ObjectId字符串
  fullName: string; // 后端字段名
  studentId: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Not Specified';
  major: string;
  enrollmentYear?: number; // 后端字段名
  status?: 'active' | 'inactive';
  nickname?: string;
  avatarPath?: string;
  resumePath?: string;
  bio?: string;
  schoolId?: string;
  bookmarkedJobs?: string[];
  appliedJobs?: string[];
  // 新增学生类型字段
  isMaster?: boolean;
  isPhd?: boolean;
  // 前端兼容字段
  name?: string; // 映射到fullName
  grade?: string; // 映射到enrollmentYear
  employmentStatus?: 'Employed' | 'Not Employed' | 'Not Specified';
  studentType:string;
}

// Interface for StudentDetails component
export interface StudentDetailsData {
  id: string;
  name: string;
  studentId: string;
  email?: string;
  gender: string;
  major: string;
  grade: string;
  status: string;
  employmentStatus: string;
}

// Interface for EditStudentForm component
export interface EditStudentFormData {
  id: string;
  name: string;
  studentId: string;
  email: string;
  gender: "Male" | "Female" | "Other";
  major: string;
  grade: string;
  status: "active" | "inactive" | "graduated";
  employmentStatus: "Employed" | "Not Employed";
  // 新增学生类型字段
  isMaster: boolean;
  isPhd: boolean;
}

// Student form data interface (for forms with optional fields)
export interface StudentFormData {
  id?: string;
  name: string;
  studentId: string;
  email?: string;
  major: string;
  grade: string;
  // 新增学生类型字段 (前端使用字符串类型，便于表单选择)
  studentType?: 'Bachelor' | 'Master' | 'Doctoral';
}

// 后端添加学生请求格式
export interface AddStudentRequest {
  fullName: string;
  studentId: string;
  email: string;
  major: string;
  enrollmentYear: number;
  // 新增学生类型字段
  isMaster: boolean;
  isPhd: boolean;
}

// Pagination parameters interface
export interface PageParams {
  current: number;
  size: number;
  name?: string;
  studentId?: string;
  email?: string;
  major?: string;
}

// API response interface
export interface ApiResponse<T> {
  list: T[];
  total: number;
  pages?: number;
}

// 后端统一响应格式
export interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  code?: number;
}

// 批量导入响应格式
export interface BulkImportResponse {
  successCount: number;
  failCount: number;
  errors?: string[];
}

// Student status mapping
export const STUDENT_STATUS = {
  'active': '1',
  'inactive': '2', 
  'graduated': '3'
} as const;

// Available majors
export const MAJOR_OPTIONS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Business Administration',
  'Economics',
  'Psychology',
  'English Literature',
  'History',
  'Art'
];

// 后端学生数据接口
interface BackendStudent {
  id: string;
  fullName: string;
  studentId: string;
  email?: string;
  gender?: string;
  major: string;
  enrollmentYear?: number;
  status?: string;
  nickname?: string;
  avatarPath?: string;
  resumePath?: string;
  bio?: string;
  schoolId?: string;
  bookmarkedJobs?: string[];
  appliedJobs?: string[];
  // 新增学生类型字段
  isMaster?: boolean;
  isPhd?: boolean;
  studentType:string;
}

// 数据转换函数：后端格式转前端格式
const transformBackendToFrontend = (backendStudent: BackendStudent): Student => {
  const gender = backendStudent.gender as 'Male' | 'Female' | 'Other' | 'Not Specified' || 'Not Specified';
  const status = backendStudent.status as 'active' | 'inactive' || 'active';
 // 根据 isMaster 和 isPhd 设置 studentType
  let studentType: 'Bachelor' | 'master' | 'phd' = 'Bachelor';
  if (backendStudent.isMaster) studentType = 'master';
  else if (backendStudent.isPhd) studentType = 'phd';

  return {
    id: String(backendStudent.id || ''), // 确保ID是字符串
    fullName: String(backendStudent.fullName || ''),
    name: String(backendStudent.fullName || ''), // 兼容字段
    studentId: String(backendStudent.studentId || ''),
    email: String(backendStudent.email || ''),
    gender,
    major: String(backendStudent.major || ''),
    enrollmentYear: backendStudent.enrollmentYear,
    grade: backendStudent.enrollmentYear ? String(backendStudent.enrollmentYear) : '', // 兼容字段
    status,
    nickname: backendStudent.nickname ? String(backendStudent.nickname) : undefined,
    avatarPath: backendStudent.avatarPath ? String(backendStudent.avatarPath) : undefined,
    resumePath: backendStudent.resumePath ? String(backendStudent.resumePath) : undefined,
    bio: backendStudent.bio ? String(backendStudent.bio) : undefined,
    schoolId: backendStudent.schoolId ? String(backendStudent.schoolId) : undefined,
    bookmarkedJobs: backendStudent.bookmarkedJobs || [],
    appliedJobs: backendStudent.appliedJobs || [],
    employmentStatus: 'Not Specified', // 后端暂无此字段
    isMaster: backendStudent.isMaster,
    isPhd: backendStudent.isPhd,
    studentType:backendStudent.studentType
  };
};

// 数据转换函数：前端格式转后端格式
// student.ts
const transformFrontendToBackend = (frontendStudent: Student | StudentFormData): AddStudentRequest => {
  let isMaster = false;
  let isPhd = false;
  const studentType = frontendStudent.studentType || 'Bachelor';
  if (studentType === 'master') isMaster = true;
  else if (studentType === 'phd') isPhd = true;

  return {
    fullName: frontendStudent.name || (frontendStudent as Student).fullName || '',
    studentId: frontendStudent.studentId,
    email: frontendStudent.email || '',
    major: frontendStudent.major,
    enrollmentYear: frontendStudent.grade ? parseInt(frontendStudent.grade) : new Date().getFullYear(),
    isMaster,
    isPhd,
  };
};

// Student API service - 使用教师端API
const studentApi = {
  // Create a new student - 使用教师添加学生API
  create: async (student: Student | StudentFormData): Promise<Student> => {
    try {
    const requestData = transformFrontendToBackend(student);
    const response = await http.post('/api/teachers/students', requestData);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to create student');
    }

      return transformBackendToFrontend(response.data.data);
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  // Update an existing student - 使用教师更新学生API
  update: async (student: Student): Promise<Student> => {
    try {
      const requestData = transformFrontendToBackend(student);
      const response = await http.put(`/api/teachers/students/${student.id}`, requestData);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update student');
      }

      return transformBackendToFrontend(response.data.data);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Get paginated student data - 使用教师查看学生API
  getPage: async (params: PageParams): Promise<PageResponse<Student>> => {
    try {
      let students: BackendStudent[] = [];

      // 如果有年份参数，使用年份查询API
      if (params.grade && !isNaN(parseInt(params.grade))) {
        const year = parseInt(params.grade);
        const response = await http.get(`/api/teachers/students/year/${year}`);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to fetch students by year');
        }

        students = response.data.data || [];
      } else {
        // 使用通用学生查询API
        const response = await http.get('/api/teachers/students');

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to fetch students');
        }

        students = response.data.data || [];
      }

      // 转换后端数据格式为前端格式
      let transformedStudents = students.map((student: BackendStudent) => transformBackendToFrontend(student));

      // 前端过滤处理（后端暂不支持复杂查询）
      if (params.name) {
        transformedStudents = transformedStudents.filter((s: Student) => {
          const name = String(s.name || '').toLowerCase();
          const fullName = String(s.fullName || '').toLowerCase();
          const searchTerm = params.name!.toLowerCase();
          return name.includes(searchTerm) || fullName.includes(searchTerm);
        });
      }

      if (params.email) {
        transformedStudents = transformedStudents.filter((s: Student) => {
          const email = String(s.email || '').toLowerCase();
          const searchTerm = params.email!.toLowerCase();
          return email.includes(searchTerm);
        });
      }

      if (params.studentId) {
        transformedStudents = transformedStudents.filter((s: Student) => {
          const studentId = String(s.studentId || '');
          const searchTerm = String(params.studentId!);
          return studentId.includes(searchTerm);
        });
      }

      if (params.major) {
        transformedStudents = transformedStudents.filter((s: Student) => {
          const major = String(s.major || '').toLowerCase();
          const searchTerm = params.major!.toLowerCase();
          return major.includes(searchTerm);
        });
      }

      // 前端分页处理
      const start = (params.current - 1) * params.size;
      const end = start + params.size;
      const paginatedStudents = transformedStudents.slice(start, end);

      return {
        list: paginatedStudents,
        total: transformedStudents.length,
        pages: Math.ceil(transformedStudents.length / params.size)
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Delete a student by ID - 使用教师删除学生API
  delete: async (id: string): Promise<void> => {
    try {
      const response = await http.delete(`/api/teachers/students/${id}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Bulk import students - 直接上传Excel文件
  bulkImportExcel: async (file: File): Promise<BackendResponse<BulkImportResponse>> => {
    try {
      // 创建FormData用于文件上传
      const formData = new FormData();
      formData.append('file', file);

      const response = await http.post('/api/teachers/students/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to import students');
      }

      return response.data;
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  },

  // Bulk import students - 保留原有方法用于兼容性
  bulkImport: async (students: Student[]): Promise<BackendResponse<BulkImportResponse>> => {
    try {
      // 创建FormData用于文件上传
      const formData = new FormData();

      // 将学生数据转换为CSV格式
      const csvHeader = 'fullName,studentId,email,major,enrollmentYear,isMaster,isPhd\n';
      const csvData = students.map(student => {
        const data = transformFrontendToBackend(student);
        return `${data.fullName},${data.studentId},${data.email},${data.major},${data.enrollmentYear},${data.isMaster},${data.isPhd}`;
      }).join('\n');

      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'students.csv');

      const response = await http.post('/api/teachers/students/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to import students');
      }

      return response.data;
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  },

  // Search students by name
  searchByName: async (name: string): Promise<Student[]> => {
    try {
      const response = await http.get(`/api/teachers/students/search?name=${encodeURIComponent(name)}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to search students');
      }

      const students = response.data.data || [];
      return students.map((student: BackendStudent) => transformBackendToFrontend(student));
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  // Get students by major
  getByMajor: async (major: string): Promise<Student[]> => {
    try {
      const response = await http.get(`/api/teachers/students/major/${encodeURIComponent(major)}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch students by major');
      }

      const students = response.data.data || [];
      return students.map((student: BackendStudent) => transformBackendToFrontend(student));
    } catch (error) {
      console.error('Error fetching students by major:', error);
      throw error;
    }
  },

  // Get students by enrollment year
  getByYear: async (year: number): Promise<Student[]> => {
    try {
      const response = await http.get(`/api/teachers/students/year/${year}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch students by year');
      }

      const students = response.data.data || [];
      return students.map((student: BackendStudent) => transformBackendToFrontend(student));
    } catch (error) {
      console.error('Error fetching students by year:', error);
      throw error;
    }
  }
};

export default studentApi;