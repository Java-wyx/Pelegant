/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 21:39:18
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-09 14:51:42
 * @FilePath: \pelegant\src\types\job.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface Job {
  companyUrl?: string;
  jobUrl?:string;
  id: string;
  jobId?: string;
  companyName: string;
  jobTitle: string;
  companyLogo: string;
  logoImage?: string | null;
  logoBackground?: string;
  location: string;
  salary: string;
  type: string;
  summary: string;
  requirements?: string[];
  responsibilities?: string[];
  searchInput?: string;
  activeCategory?: string;
  jobType?:string;
  // 推荐相关字段
  recommendationScore?: number;
  recommendationReason?: string;
  recommendationType?: string;
  isViewed?: boolean;
  isSaved?:boolean;
}

export function toJobType(data: Record<string, unknown>): Job {
  // 处理技能要求数组
  let requirements: string[] = [];
  if (data.skillsRequired && Array.isArray(data.skillsRequired)) {
    requirements = data.skillsRequired as string[];
  } else if (data.jobRequirements && typeof data.jobRequirements === 'string') {
    requirements = [data.jobRequirements as string];
  } else if (data.requirements && Array.isArray(data.requirements)) {
    requirements = data.requirements as string[];
  }

  // 处理福利待遇作为职责
  let responsibilities: string[] = [];
  if (data.benefits && typeof data.benefits === 'string') {
    responsibilities = [data.benefits as string];
  } else if (data.responsibilities && Array.isArray(data.responsibilities)) {
    responsibilities = data.responsibilities as string[];
  }

  // 处理薪资显示
  let salary = '';
  if (data.minSalary && data.maxSalary) {
    salary = `${data.minSalary} - ${data.maxSalary}`;
  } else if (data.salary) {
    salary = data.salary as string;
  }

  // 确保id字段存在且为字符串
  const id = data.id as string || data.jobId as string || '';

  return {
    id: id,
    jobId: data.jobId as string,
    companyName: data.company as string || data.companyName as string || '',
    jobTitle: data.title as string || data.jobTitle as string || '',
    companyLogo: data.companyLogo as string || '',
    logoImage: data.logoImage as string | null || null,
    logoBackground: data.logoBackground as string || '',
    location: data.location as string || data.workLocation as string || '',
    companyUrl : data.companyUrl as string,
    jobUrl : data.jobUrl as string,
    salary: salary,
    type: data.type as string || data.jobType as string || data.employmentType as string || '',
    summary: data.description as string || data.summary as string || data.jobDescription as string || '',
    requirements: requirements,
    responsibilities: responsibilities,
    // 推荐相关字段
    recommendationScore: data.recommendationScore as number,
    recommendationReason: data.recommendationReason as string,
    recommendationType: data.recommendationType as string,
    isViewed: data.isViewed as boolean,
   
  };
}
