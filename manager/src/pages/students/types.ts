/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:40
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-28 15:41:51
 * @FilePath: \pelegant\src\pages\students\types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

export interface Student {
  id: number;
  name: string;
  gender: string;
  university: string;
  major: string;
  grade: string;
  status: 'active' | 'inactive' | 'graduate';
  enrollmentDate: string;
  resume?: string;
  description?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  academicInfo?: {
    gpa?: number;
    awards?: string[];
    projects?: string[];
  };
  isFirstLogin:boolean;
}

export const mockStudents: Student[] = [
  { 
    id: 1, 
    name: '张三', 
    gender: '男', 
    university: '牛津大学', 
    major: '计算机科学与技术', 
    grade: '大三', 
    status: 'active',
    enrollmentDate: '2021-09-01',
    resume: 'https://example.com/resumes/zhangsan.pdf',
    description: '计算机科学专业学生，对人工智能和机器学习有浓厚兴趣。参与过多个校内项目，有扎实的编程基础。',
    contactInfo: {
      email: 'zhangsan@example.com',
      phone: '123-4567-8901',
      address: '北京市海淀区'
    },
    academicInfo: {
      gpa: 3.8,
      awards: ['优秀学生奖学金', '编程竞赛一等奖'],
      projects: ['智能聊天机器人', '校园导航系统']
    },
    isFirstLogin:false
  },
  
];
