/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:39
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-29 11:09:04
 * @FilePath: \pelegant\src\pages\schools\types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

export interface School {
  id: string; // 改为string以匹配后端MongoDB ObjectId
  schoolId: string; // 学校编号
  name: string; // 对应后端的universityName
  type: string; // 对应后端的universityType
  location: string; // 对应后端的universityAddress
  website?: string; // 对应后端的universityWebsite
  description?: string; // 对应后端的universityDescription
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt?: string;
  adminEmail: string;
  hasInitialPassword: boolean;
  continent:string;
  country:string;
  region:string;
}

// 后端数据转换为前端数据的辅助函数
export const transformSchoolFromBackend = (backendSchool: any): School => {
  return {
    id: backendSchool.id,
    schoolId: backendSchool.schoolId,
    name: backendSchool.universityName,
    type: backendSchool.universityType,
    location: backendSchool.universityAddress,
    website: backendSchool.universityWebsite,
    description: backendSchool.universityDescription,
    status: backendSchool.status as 'active' | 'inactive' | 'pending',
    createdAt: backendSchool.createdAt ? new Date(backendSchool.createdAt).toLocaleDateString() : '',
    updatedAt: backendSchool.updatedAt ? new Date(backendSchool.updatedAt).toLocaleDateString() : '',
    adminEmail: backendSchool.adminEmail || '',
    hasInitialPassword: true, // 后端创建学校时会自动创建管理员账户
    continent:backendSchool.continent,
    country:backendSchool.country,
    region:backendSchool.region
  };
};

// 前端数据转换为后端数据的辅助函数
export const transformSchoolToBackend = (frontendSchool: Partial<School>) => {
  return {
    universityName: frontendSchool.name,
    universityType: frontendSchool.type,
    universityAddress: frontendSchool.location,
    universityWebsite: frontendSchool.website,
    universityDescription: frontendSchool.description,
    adminEmail: frontendSchool.adminEmail,
    status: frontendSchool.status || 'active',
      continent:frontendSchool.continent,
    country:frontendSchool.country,
    region:frontendSchool.region

  };
};

export const mockSchools: School[] = [
  { 
    id: 1, 
    name: 'Oxford University', 
    type: '综合类大学', 
    location: '英国牛津', 
    status: 'active',
    createdAt: '2023-01-15',
    adminEmail: 'admin@oxford.edu',
    hasInitialPassword: true,
    continent:'',
    country:'',
    region:''
  },
  
];

// Function to generate a random password
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
