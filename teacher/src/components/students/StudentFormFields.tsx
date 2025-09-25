// Modified: StudentFormFields.tsx
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAJOR_OPTIONS } from "@/api/student";
import { Control, FieldValues } from "react-hook-form";
import { BaseStudentFormValues } from "./StudentFormTypes";

interface StudentFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  includeId?: boolean;
}

export function StudentFormFields({ 
  control, 
  includeId = false 
}: StudentFormFieldsProps) {
  const currentYear = new Date().getFullYear();
  const grades = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString(),
    (currentYear - 3).toString(),
  ];

  return (
    <>
      {includeId && (
        <FormField
          control={control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter student name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />


      <FormField
        control={control}
        name="studentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Student ID</FormLabel>
            <FormControl>
              <Input placeholder="Enter student ID" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="Enter student email" type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="major"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select major" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MAJOR_OPTIONS.map((major) => (
                  <SelectItem key={major} value={major}>
                    {major}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="grade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Year</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select class year" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {grades.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
  control={control}
  name="studentType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Student Type</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select student type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {/* 修改选项值以匹配 StudentForm.tsx 中的枚举 */}
          <SelectItem value="Bachelor">Bachelor</SelectItem>
          <SelectItem value="master">Master</SelectItem>
          <SelectItem value="phd">Doctoral</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
    </>
  );
};