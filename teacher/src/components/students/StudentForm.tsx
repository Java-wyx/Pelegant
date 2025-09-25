// StudentForm.tsx
import React, { useRef, useState, useEffect, useMemo} from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { MAJOR_OPTIONS } from "@/api/student";
import { StudentFormFields } from './StudentFormFields';
import { useTranslation } from 'react-i18next';

const baseStudentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  studentId: z.string().min(1),
  email: z.union([z.string().email(), z.literal('')]),
  major: z.string().min(1),
  grade: z.string().min(1),
  studentType: z.enum(['Bachelor', 'master', 'phd']),
});

// 表单值类型
type FormValues = z.infer<typeof baseStudentFormSchema>;


// 批量导入数据接口
interface BulkImportData {
  name: string;
  studentId: string;
  email: string;
  major: string;
  grade: string;
  studentType: 'Bachelor' | 'master' | 'phd';
}

// 工作表数据接口
interface WorksheetData {
  sheetName: string;
  data: BulkImportData[];
}

type FormMode = 'add' | 'edit' | 'view';

const STATUS_MAPPING = {
  '1': 'active',
  '2': 'inactive',
  '3': 'graduated'
} as const;

type StatusKey = keyof typeof STATUS_MAPPING;
type StatusValue = typeof STATUS_MAPPING[StatusKey];

interface StudentFormProps {
  mode: FormMode;
  student?: FormValues;
  onSubmit?: (data: FormValues) => void;
  onBulkImport?: (data: BulkImportData[]) => void;
  onExcelImport?: (file: File) => void;
  onCancel: () => void;
}

interface ViewModeProps {
  student?: FormValues;
}

// 格式化 studentType 显示
const formatStudentType = (type?: string): string => {
  if (!type) return 'Bachelor';
  const normalizedType = type.toLowerCase().trim();
  switch (normalizedType) {
    case 'bachelor':
    case 'undergraduate':
    case 'bsc':
    case 'ba':
    case '本科':
      return 'Bachelor';
    case 'master':
    case 'masters':
    case 'msc':
    case 'ma':
    case 'graduate':
    case '硕士':
      return 'Master';
    case 'phd':
    case 'doctor':
    case 'doctoral':
    case 'dphil':
    case 'doctorate':
    case '博士':
      return 'PhD';
    default:
      return 'Bachelor';
  }
};

const StudentForm: React.FC<StudentFormProps> = ({
  mode,
  student,
  onSubmit,
  onBulkImport,
  onExcelImport,
  onCancel
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<BulkImportData[] | null>(null);
  const [allSheetData, setAllSheetData] = useState<WorksheetData[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { t, i18n } = useTranslation();
  // 定义表单验证 schema
const formSchema = useMemo(() =>
  baseStudentFormSchema.shape.id.optional().and(z.object({
    name: z.string().min(1, { message: t('studentForm.validation.nameRequired') }),
    studentId: z.string().min(1, { message: t('studentForm.validation.studentIdRequired') }),
    email: z.union([
      z.string().email({ message: t('studentForm.validation.emailInvalid') }),
      z.literal('')
    ]),
    major: z.string().min(1, { message: t('studentForm.validation.majorRequired') }),
    grade: z.string().min(1, { message: t('studentForm.validation.gradeRequired') }),
    studentType: z.enum(['Bachelor','master','phd'] as const, {
      errorMap: () => ({ message: t('studentForm.validation.studentTypeInvalid') })
    })
  }))
,[t, i18n.language]);



  // 修复：确保表单正确初始化 studentType 值
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      studentId: "",
      email: "",
      major: MAJOR_OPTIONS[0],
      grade: new Date().getFullYear().toString(),
      studentType: 'Bachelor',
      ...(mode === 'edit' && student ? student : {})
    }
  });

  // 修复：当 student prop 变化时更新表单值
  useEffect(() => {
    if (mode === 'edit' && student) {
      form.reset(student);
    }
  }, [mode, student, form]);

  // Available majors
  const majors = MAJOR_OPTIONS;

  // Available class years (grades)
  const currentYear = new Date().getFullYear();
  const grades = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString(),
    (currentYear - 3).toString(),
  ];

  // 处理Excel文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: t('studentForm.upload.fileTypeError'),
        description: t('studentForm.upload.fileTypeHint'),
        variant: "destructive",
      });
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('studentForm.upload.fileTooLarge'),
        description: t('studentForm.upload.fileSizeLimit'),
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const allSheetData: WorksheetData[] = [];

        // 遍历所有工作表
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast({
              title: `t('studentForm.upload.sheetInvalid', { sheet: sheetName })`,
              description: `t('studentForm.upload.sheetEmpty', { sheet: sheetName })`,
              variant: "destructive",
            });
            return;
          }

          interface ExcelRowData {
            name?: unknown;
            fullName?: unknown;
            fullname?: unknown;
            studentId?: unknown;
            email?: unknown;
            major?: unknown;
            grade?: unknown;
            enrollmentYear?: unknown;
            studentType?: unknown;
          }

          // 验证并转换数据
          const validatedData = jsonData.map((row: ExcelRowData) => {
            let studentType: 'Bachelor' | 'master' | 'phd' = 'Bachelor';
            const rawType = String(row.studentType || '').toLowerCase().trim();
            if (['master', 'masters', 'msc', 'ma', 'graduate', '硕士'].includes(rawType)) {
              studentType = 'master';
            } else if (['phd', 'doctor', 'doctoral', 'dphil', 'doctorate', '博士'].includes(rawType)) {
              studentType = 'phd';
            } else if (['bachelor', 'undergraduate', 'bsc', 'ba', '本科'].includes(rawType) || rawType === '') {
              studentType = 'Bachelor';
            } else {
              toast({
                title: t('studentForm.upload.studentTypeInvalid'),
                description: `t('studentForm.upload.studentTypeError', { sheet: sheetName, type: rawType })`,
                variant: "destructive",
              });
            }

            const data: BulkImportData = {
              name: String(row.name || row.fullName || row.fullname || ''),
              studentId: String(row.studentId || ''),
              email: String(row.email || ''),
              major: String(row.major || MAJOR_OPTIONS[0]),
              grade: String(row.grade || row.enrollmentYear || new Date().getFullYear().toString()),
              studentType,
            };
            return data;
          });

          allSheetData.push({ sheetName, data: validatedData });
        });

        // 展平数据用于导入
        const flattenedData = allSheetData.flatMap((sheet) => sheet.data);
        setFileData(flattenedData);
        setAllSheetData(allSheetData);

        toast({
          title: t('studentForm.upload.readyTitle'),
          description: `t('studentForm.upload.readyDesc', { count: flattenedData.length, sheets: allSheetData.length })`,
        });

        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Excel import error:', error);
        toast({
          title: t('studentForm.upload.failedTitle'),
          description: t('studentForm.upload.failedDesc'),
          variant: "destructive",
        });
        setFileData(null);
        setAllSheetData(null);
        setUploadedFile(null);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 处理导入按钮点击
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 处理批量导入提交
  const handleBulkImportSubmit = () => {
    if (uploadedFile && fileData && fileData.length > 0 && onBulkImport) {
      if (onExcelImport) {
        onExcelImport(uploadedFile);
      } else {
        onBulkImport(fileData);
      }
      setFileData(null);
      setAllSheetData(null);
      setFileName("");
      setUploadedFile(null);
    } else {
      toast({
        title: t('studentForm.upload.noDataTitle'),
        description: t('studentForm.upload.noDataDesc'),
        variant: "destructive",
      });
    }
  };

  // 查看模式
  const ViewMode = ({ student }: ViewModeProps) => (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600">
            {student?.name?.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">{student?.name}</h2>
          <p className="text-gray-500">{student?.studentId}</p>
          {student?.email && <p className="text-gray-500 mt-1">{student.email}</p>}
        </div>

        <div className="grid gap-4 pt-2">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">{t('studentForm.view.major')}</span>
            <span>{student?.major}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">{t('studentForm.view.grade')}</span>
            <span>{student?.grade}</span>
          </div>

          {student?.email && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">{t('studentForm.view.email')}</span>
              <span>{student.email}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">{t('studentForm.view.studentType')}</span>
            <span>{formatStudentType(student?.studentType)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">{t('studentForm.view.status')}</span>
            <span>{student?.status ? STATUS_MAPPING[student.status as StatusKey] : ''}</span>
          </div>

          {(student as any)?.gender && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">{t('studentForm.view.gender')}</span>
              <span>{(student as any).gender}</span>
            </div>
          )}

          {(student as any)?.employmentStatus && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">{t('studentForm.view.employmentStatus')}</span>
              <span>{(student as any).employmentStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 批量导入选项卡
  const BulkImportTab: React.FC<{
    fileInputRef: React.RefObject<HTMLInputElement>;
    fileData: BulkImportData[] | null;
    allSheetData: WorksheetData[] | null;
    fileName: string;
    onImportClick: () => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBulkImportSubmit: () => void;
    onCancel: () => void;
  }> = ({
    fileInputRef,
    fileData,
    allSheetData,
    fileName,
    onImportClick,
    onFileUpload,
    onBulkImportSubmit,
    onCancel
  }) => (
<div className="space-y-6">
  <div className="bg-blue-50/70 rounded-lg border border-blue-100/80 overflow-hidden">
    <div className="p-6">
      <div className="flex flex-col items-center space-y-6">
        <div onClick={onImportClick} className="w-full cursor-pointer">
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 flex flex-col items-center justify-center bg-white hover:bg-blue-50/50 transition-colors">
            <div className="bg-blue-100/70 p-3 rounded-full mb-4">
              <FileText className="h-8 w-8 text-career-blue" />
            </div>
            {!fileName ? (
              <>
                <p className="font-medium text-career-blue mb-1 text-lg">{t('studentForm.bulk.selectFile')}</p>
                <p className="text-sm text-gray-500">{t('studentForm.bulk.dragDrop')}</p>
              </>
            ) : (
              <>
                <p className="font-medium text-green-600 mb-1 flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5" /> {t('studentForm.bulk.fileSelected')}
                </p>
                <p className="text-sm text-gray-600 max-w-xs truncate">{fileName}</p>
              </>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <div className="w-full">
          <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-100/80">
            <h4 className="text-md font-medium text-gray-700 mb-2">{t('studentForm.bulk.requirementsTitle')}</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>{t('studentForm.bulk.requirements.format')}</li>
              <li>{t('studentForm.bulk.requirements.columns')}</li>
              <li>{t('studentForm.bulk.requirements.header')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Display the sheet data when file is uploaded */}
  
  </div>
  <div className="flex justify-end gap-3">
    <Button type="button" variant="outline" onClick={onCancel}>
      {t('common.cancel')}
    </Button>
    <Button
      type="button"
      onClick={onBulkImportSubmit}
      disabled={!fileData}
      className={`${fileData ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {t('studentForm.bulk.import')}
    </Button>
  </div>
</div>


  );

  return (
    <div className="space-y-6">
      {mode === 'view' ? (
        <ViewMode student={student} />
      ) : mode === 'add' ? (
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single">{t('studentForm.tabs.single')}</TabsTrigger>
            <TabsTrigger value="bulk">{t('studentForm.tabs.bulk')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <StudentFormFields control={form.control} includeId={false} />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('studentForm.actions.add')}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="bulk" className="pt-4">
            <BulkImportTab
              fileInputRef={fileInputRef}
              fileData={fileData}
              allSheetData={allSheetData}
              fileName={fileName}
              onImportClick={handleImportClick}
              onFileUpload={handleFileUpload}
              onBulkImportSubmit={handleBulkImportSubmit}
              onCancel={onCancel}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid gap-5 sm:grid-cols-1">
              <StudentFormFields control={form.control} includeId={true} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('studentForm.actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default StudentForm;