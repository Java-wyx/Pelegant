// StudentForm.tsx
import React, { useRef, useState, useEffect } from 'react';
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

// 定义表单验证 schema
const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Name is required" }),
  studentId: z.string().min(1, { message: "Student ID is required" }),
  email: z.string().email({ message: "Valid email is required" }).or(z.string().length(0)),
  major: z.string().min(1, { message: "Major is required" }),
  grade: z.string().min(1, { message: "Class year is required" }),
  studentType: z.enum(['Bachelor', 'master', 'phd'], { message: "Student type must be Bachelor, master, or phd" }),
});

// 表单值类型
type FormValues = z.infer<typeof formSchema>;

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
        title: "File type error",
        description: "Please upload an Excel file (.xlsx or .xls format)",
        variant: "destructive",
      });
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "the file is too large",
        description: "The file size cannot exceed 5MB",
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
              title: `worksheet ${sheetName} verification failed`,
              description: `worksheet ${sheetName} Empty or no valid data`,
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
                title: "Invalid student type",
                description: `worksheet ${sheetName} It contains invalid student types: ${rawType}`,
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
          title: "The documents are all ready",
          description: `Loaded${flattenedData.length}student records（${allSheetData.length}worksheet），Click "Import Student" to complete the import`,
        });

        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Excel import error:', error);
        toast({
          title: "Import failed",
          description: "The processing program has an error and cannot be archived in Excel",
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
        title: "no data",
        description: "Please upload a valid Excel file first.",
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
            <span className="font-medium text-gray-500">Major</span>
            <span>{student?.major}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">Class Year</span>
            <span>{student?.grade}</span>
          </div>

          {student?.email && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">Email</span>
              <span>{student.email}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">Student Type</span>
            <span>{formatStudentType(student?.studentType)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium text-gray-500">Status</span>
            <span>{student?.status ? STATUS_MAPPING[student.status as StatusKey] : ''}</span>
          </div>

          {(student as any)?.gender && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">Gender</span>
              <span>{(student as any).gender}</span>
            </div>
          )}

          {(student as any)?.employmentStatus && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-500">Employment Status</span>
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
                <p className="font-medium text-career-blue mb-1 text-lg">Select Excel File</p>
                <p className="text-sm text-gray-500">or drag and drop file here</p>
              </>
            ) : (
              <>
                <p className="font-medium text-green-600 mb-1 flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5" /> File Selected
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
            <h4 className="text-md font-medium text-gray-700 mb-2">Requirements:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Excel file (.xlsx, .xls) format</li>
              <li>Required columns: <span className="font-medium text-career-blue">name</span>, <span className="font-medium text-career-blue">studentId</span>, <span className="font-medium text-career-blue">email</span>, <span className="font-medium text-career-blue">major</span>, <span className="font-medium text-career-blue">grade</span>, <span className="font-medium text-career-blue">studentType</span> (Bachelor/master/phd)</li>
              <li>First row should contain column headers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Display the sheet data when file is uploaded */}
  
  </div>
  <div className="flex justify-end gap-3">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button
      type="button"
      onClick={onBulkImportSubmit}
      disabled={!fileData}
      className={`${fileData ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      Import Students
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
            <TabsTrigger value="single">Add Single Student</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <StudentFormFields control={form.control} includeId={false} />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Student
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
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default StudentForm;