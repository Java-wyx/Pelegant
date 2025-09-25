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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <>
      {includeId && (
        <FormField
          control={control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('studentForm.fields.id')}</FormLabel>
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
            <FormLabel>{t('studentForm.fields.name')}</FormLabel>
            <FormControl>
              <Input placeholder={t('studentForm.fields.namePlaceholder')} {...field} />
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
            <FormLabel>{t('studentForm.fields.studentId')}</FormLabel>
            <FormControl>
              <Input placeholder={t('studentForm.fields.studentIdPlaceholder')} {...field} />
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
            <FormLabel>{t('studentForm.fields.email')}</FormLabel>
            <FormControl>
              <Input placeholder={t('studentForm.fields.emailPlaceholder')} type="email" {...field} />
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
            <FormLabel>{t('studentForm.fields.major')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('studentForm.fields.majorPlaceholder')} />
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
            <FormLabel>{t('studentForm.fields.grade')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('studentForm.fields.gradePlaceholder')} />
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
      <FormLabel>{t('studentForm.fields.studentType')}</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={t('studentForm.fields.studentTypePlaceholder')} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {/* 修改选项值以匹配 StudentForm.tsx 中的枚举 */}
          <SelectItem value="Bachelor">{t('studentForm.studentType.bachelor')}</SelectItem>
          <SelectItem value="master">{t('studentForm.studentType.master')}</SelectItem>
          <SelectItem value="phd">{t('studentForm.studentType.phd')}</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
    </>
  );
};