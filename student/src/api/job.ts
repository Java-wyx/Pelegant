import axios from "axios";
import http from "./http";
import type { Job } from "@/types/job";
import { toJobType } from "@/types/job";
import { useAuthStore } from "@/stores/auth";

export const JobService = {
  // 获取职位详情
  getJobDetails: async (jobId: string): Promise<Job> => {
    try {
      const response = await http.get(`/students/jobs/${jobId}`);
      return toJobType(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('Failed to fetch job details');
    }
  },

  searchJobs: async (keyword: string, jobType?: string): Promise<Job[]> => {
    try {
      const response = await http.get('/students/jobs/search', {
        params: {
          keyword,
          employmentType: jobType === "All" ? undefined : jobType
        }
      });
      const jobs = Array.isArray(response.data.list) ? response.data.list : [];
      return jobs.map(toJobType);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('Failed to search jobs');
    }
  },

  saveJob: async (jobId: string): Promise<void> => {
    const { userId } = useAuthStore.getState();
    await http.post(`/students/pelegant/job-seeker/save-job?studentId=${userId}&jobId=${jobId}`);
  },



  // 申请职位
  applyJob: async (jobId: string): Promise<void> => {
   return   await http.post(`/students/pelegant/job-seeker/apply-job?jobId=${jobId}`);
      
  },

  // 获取已申请职位列表
  getAppliedJobs: async (): Promise<Job[]> => {
    const { userId } = useAuthStore.getState();
    const response = await http.get(`/students/applications/${userId}`);
    return response.data.map(toJobType);
  },

  // 获取已保存职位列表
  getSavedJobs: async (): Promise<Job[]> => {
    const { userId } = useAuthStore.getState();
    const response = await http.get(`/students/bookmarks/${userId}`);
    return response.data.map(toJobType);
  },



  // 上传简历
  uploadResume: async (file: File, modelType = "openai"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modelType", modelType);

    const response = await http.post('/pelegant/job-seeker/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000
    });
    return response.data;
  },

  // 下载简历
  downloadResume: async (resumeId: string): Promise<Blob> => {
    const response = await http.get(`/pelegant/job-seeker/download-resume?id=${resumeId}`, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf, application/octet-stream'
      }
    });

    // 验证响应数据
    if (!response || !(response instanceof ArrayBuffer)) {
      throw new Error('Invalid response data from server');
    }

    // 创建Blob对象
    const blob = new Blob([response], { type: 'application/octet-stream' });

    // 验证Blob数据
    if (blob.size === 0) {
      throw new Error('Created blob is empty');
    }

    return blob;
  },

  // 获取推荐工作列表
  getRecommendedJobs: async (): Promise<Job[]> => {
    try {
      const { userId } = useAuthStore.getState();
      const response = await http.get('/students/recommended-work/list', {
        params: { studentId: userId }
      });
      // 后端返回格式：Result<List<RecommendedJobResponse>>
      // response.data 是 Result 对象，实际数据在 response.data.data 中
      const jobs = Array.isArray(response.data) ? response.data : [];
      return jobs.map((recommendedJob: any) => {
        // AI推荐数据结构
        const jobData = {
          id: recommendedJob.recommendationId, // 使用推荐记录ID作为唯一标识
          jobId: recommendedJob.jobId || recommendedJob.recommendationId, // AI推荐可能没有jobId
          jobTitle: recommendedJob.jobTitle,
          companyName: recommendedJob.companyName,
          workLocation: recommendedJob.location,
          salary: recommendedJob.salaryRange,
          jobType: recommendedJob.employmentType,
          jobDescription: recommendedJob.jobDescription,
          skillsRequired: recommendedJob.skillsRequired,
          experienceLevel: recommendedJob.experienceLevel,
          educationLevel: recommendedJob.educationLevel,
          jobStatus: recommendedJob.jobStatus,
          recommendationScore: recommendedJob.matchScore, // AI推荐的匹配分数
          recommendationReason: recommendedJob.recommendationReason, // AI推荐理由
          recommendationType: 'AI', // 标记为AI推荐
          isViewed: false
        };
        return toJobType(jobData);
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('Failed to fetch recommended jobs');
    }
  },

  // 获取推荐工作数量
  getRecommendedJobsCount: async (): Promise<number> => {
    try {
      const { userId } = useAuthStore.getState();
      const response = await http.get('/students/recommended-work/count', {
        params: { studentId: userId }
      });
      // 后端返回格式：Result<Long>
      // response.data 是 Result 对象，实际数据在 response.data.data 中
      return response.data || 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('Failed to fetch recommended jobs count');
    }
  },

  // 生成AI推荐工作
  generateAIRecommendations: async (): Promise<string> => {
    try {
      const { userId } = useAuthStore.getState();
      const response = await http.post('/students/recommended-work/generate', null, {
        params: { studentId: userId }
      });
      // 后端返回格式：Result<String>
      return response.data?.message || 'AI推荐生成成功';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('Failed to generate AI recommendations');
    }
  },
  //
isApplied: async (jobId: string): Promise<{ isApplied: boolean }> => {
  const response = await http.get(`/students/pelegant/job-seeker/is-applied?jobId=${jobId}`);
  console.log('isApplied API response:', response.data); // 打印后端返回的完整数据
  return { isApplied: response.data };
},

// job.ts
getSavedStatusBatch: async (jobIds: string[]): Promise<Record<string, boolean>> => {
  const query = jobIds.map(id => `jobIds=${encodeURIComponent(id)}`).join("&");
  const response = await http.get(`/students/pelegant/job-seeker/is-saved-batch?${query}`);
  return response.data;
},

cancelApply: (jobId: string) => {
  return http.post("/students/pelegant/job-seeker/cancel-apply", {
    jobId,
  });
},
 getAllJobs: async () => {
    try {
      const response = await http.get("/students/pelegant/job-seeker/get-all-jobs");
      // 确保返回的是 data 数组
      return response.data || []; // 确保只返回工作列表的数组
      
    } catch (error) {
      console.error('获取所有工作时出错:', error);
      throw new Error('获取所有工作失败');
    }
  },

};
