import http from './http';
import { useAuthStore } from '@/stores/auth';

export interface ResumeInfo {
  hasResume: boolean;
  resumePath: string;
  fileExists: boolean;
  fileSize?: number;
  lastModified?: string;
  studentName: string;
  major: string;
  parseStatus?: string;
  parseError?: string;
  parsedData?: any;
  name?: string;
  email?: string;
  gender?: string;
  mobile?: string;
  awardList?: any[];
  educationList?: any[];
  workExperienceList?: any[];
  projectList?: any[];
  skillList?: string[];
  selfEvaluation?: string;
}

export const ResumeService = {
  // 上传简历
  uploadResume: async (file: File): Promise<string> => {
    const { userId } = useAuthStore.getState();
    if (!userId) {
      throw new Error("用户未登录");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentId", userId);
    
    const response = await http.post('/students/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000
    });

    if (!response.success) {
      throw new Error(response.message || "简历上传失败");
    }

    return response.data; // 返回文件路径
  },

  // 更新简历
  updateResume: async (file: File): Promise<string> => {
    const { userId } = useAuthStore.getState();
    if (!userId) {
      throw new Error("用户未登录");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("studentId", userId);
    
    const response = await http.put('/students/resume/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000
    });

    if (!response.success) {
      throw new Error(response.message || "简历更新失败");
    }

    return response.data; // 返回文件路径
  },

  // 获取简历信息
  getResumeInfo: async (): Promise<ResumeInfo> => {
    const { userId } = useAuthStore.getState();
    if (!userId) {
      throw new Error("用户未登录");
    }

    const response = await http.get(`/students/resume/${userId}`);

    if (!response.success) {
      throw new Error(response.message || "获取简历信息失败");
    }

    return response.data;
  },

  // 手动触发简历解析
  parseResume: async (): Promise<any> => {
    const { userId } = useAuthStore.getState();
    if (!userId) {
      throw new Error("用户未登录");
    }

    const response = await http.post(`/students/resume/parse/${userId}`);

    if (!response.success) {
      throw new Error(response.message || "简历解析失败");
    }

    return response.data;
  },

  // 下载简历文件
  downloadResume: async (resumePath: string): Promise<Blob> => {
    const response = await fetch(resumePath, {
      method: 'GET',
      headers: {
        'student': `Bearer ${useAuthStore.getState().accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('下载简历失败');
    }

    return response.blob();
  }
};
