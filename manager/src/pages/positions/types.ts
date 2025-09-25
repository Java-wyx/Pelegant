
export interface Position {
  id: string; // 改为string类型以匹配后端自定义jobId
  title: string;
  company: string;
  location: string;
  companyId:string;
  type: string;
  jobDescription: string;
  status: 'active' | 'inactive' | 'filled';
  postDate: string;
  applicants: number;
}

export const mockPositions: Position[] = [
  {
    id: 'job1',
    title: '前端开发工程师',
    company: '腾讯科技有限公司',
    location: '深圳',
    type: 'Full Time',
    jobDescription: '负责公司核心产品的前端开发，优化用户体验，开发新功能',
    status: 'active',
    postDate: '2025-03-15',
    applicants: 24,
    companyId:"COM001"
  },
 
];
