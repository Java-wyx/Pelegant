// Modified: StudentFormTypes.ts
/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:12:59
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-31 16:07:17
 * @FilePath: \pelegant\src\components\students\StudentFormTypes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { MAJOR_OPTIONS } from "@/api/student";
import { Control, FieldValues } from "react-hook-form";

export interface BaseStudentFormValues {
  id?: number;
  name?: string;
  studentId?: string;
  email?: string;
  major?: typeof MAJOR_OPTIONS[number];
  grade?: string;
  gender?: "Male" | "Female" | "Other";
  status?: "active" | "inactive" | "graduated";
  employment?: "Employed" | "Not Employed";
  // 新增学生类型
  studentType?: 'undergraduate' | 'master' | 'phd';
}


export interface EditStudentFormValues extends BaseStudentFormValues {
  id: number;
  gender: "Male" | "Female" | "Other";
  status: "active" | "inactive" | "graduated";
  employment: "Employed" | "Not Employed";
  studentType: 'undergraduate' | 'master' | 'phd';
}