// Modified: Students.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PlusCircle, Search, Eye, Edit2, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import StudentForm from "@/components/students/StudentForm";
import studentApi, {
  Student,
  StudentFormData,
  PageParams,
} from "@/api/student";
import { useTranslation } from "react-i18next";

const Students: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false); // 防止重复操作

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Students data from API
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Majors for filtering
  const majors = [
    { value: "computerScience" },
    { value: "softwareEngineering" },
    { value: "electronicEngineering" },
    { value: "artificialIntelligence" },
    { value: "dataScience" }
  ];


  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: PageParams = {
        current: currentPage,
        size: pageSize,
      };

      // Apply major filter if not 'all'
      if (majorFilter !== "all") {
        params.major = majorFilter;
      }

      // Apply search filter if any
      if (searchQuery) {
        if (searchQuery.includes("@")) {
          params.email = searchQuery;
        } else if (/^\d+$/.test(searchQuery)) {
          params.studentId = searchQuery;
        } else {
          params.name = searchQuery;
        }
      }

      console.log("Sending params:", params); // 调试
      const response = await studentApi.getPage(params);
      console.log("Received response:", response); // 调试

      if (response.list) {
        setStudentsData(response.list);
        setTotalItems(response.total);
        setTotalPages(response.pages || Math.ceil(response.total / pageSize));
      } else {
        setStudentsData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      let errorMessage = "Failed to obtain student data. Please try again.";

      if (error instanceof Error) {
        // Handle different types of errors
        if (error.message.includes("认证") || error.message.includes("token")) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes("权限")) {
          errorMessage = "There is no permission to access student data.";
        } else if (error.message.includes("网络")) {
          errorMessage = "The network connection failed. Please check the network connection";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      toast({
        title: "fail to load",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset data on error
      setStudentsData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle change in search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);

    // Reset the pagination to page 1 when search query is cleared
    if (e.target.value === "") {
      setMajorFilter('all');
      setCurrentPage(1);
    }
  };

  const handleMajorFilterChange = (value: string) => {
    setMajorFilter(value);
    setCurrentPage(1); // 重置到第一页
  };

  // Fetch students when filter or pagination changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300); // 防抖

    return () => clearTimeout(timer);
  }, [currentPage, pageSize, majorFilter, searchQuery]);

  // Handle add new student
  const handleAddStudent = async (newStudent: StudentFormData) => {
    if (isOperating) return; // 防止重复操作
    setIsOperating(true);

    try {
      // 转换前端表单数据为后端API格式
      const studentToAdd: Student = {
        fullName: newStudent.name,
        name: newStudent.name, // 兼容字段
        studentId: newStudent.studentId,
        email: newStudent.email || "",
        major: newStudent.major,
        enrollmentYear: parseInt(newStudent.grade) || new Date().getFullYear(),
        grade: newStudent.grade, // 兼容字段
        gender: "Not Specified",
        status: "active",
        employmentStatus: "Not Employed",
        studentType: newStudent.studentType // 传递 studentType
      };

      await studentApi.create(studentToAdd);
      setAddDialogOpen(false);

      // Refresh the student list
      await fetchStudents();

      // 使用 sonner toast 避免媒体播放冲突
      sonnerToast.success(`${newStudent.name} Has been successfully added to the system`);
    } catch (error) {
      console.error("Error adding student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add a student. Please try again.";
      sonnerToast.error(errorMessage);
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Excel file import directly
const handleExcelImport = async (file: File) => {
  if (isOperating) return;
  setIsOperating(true);

  try {
    await studentApi.bulkImportExcel(file);
    setAddDialogOpen(false);
    await fetchStudents();
    toast({
      title: "Batch import successful",
      description: "The Excel file has been successfully imported into the system",
    });
  } catch (error) {
    console.error("Error importing Excel:", error);
    const errorMessage =
      error instanceof Error ? error.message : "The Excel file has been successfully imported into the system. The import of Excel failed. Please try again";
    toast({
      title: "Import failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsOperating(false);
  }
};

  // Handle bulk import from Excel (保留兼容性)
  const handleBulkImport = async (
  excelData: {
    name: string;
    studentId: string;
    email?: string;
    major?: string;
    grade?: string;
    studentType?: 'undergraduate' | 'master' | 'phd';
  }[]
) => {
  try {
    const newStudents: Student[] = excelData.map((row) => {
      const gradeYear = String(row.grade || new Date().getFullYear().toString());
      return {
        fullName: String(row.name || "Unknown"),
        name: String(row.name || "Unknown"),
        studentId: String(row.studentId || `TEMP-${Date.now()}`),
        major: String(row.major || "Computer Science"),
        enrollmentYear: parseInt(gradeYear) || new Date().getFullYear(),
        grade: gradeYear,
        gender: "Not Specified",
        status: "active",
        employmentStatus: "Not Employed",
        email: row.email ? String(row.email) : "",
        isMaster: row.studentType === 'master',
        isPhd: row.studentType === 'phd',
      };
    });

    await studentApi.bulkImport(newStudents);
    setAddDialogOpen(false);
    await fetchStudents();
    toast({
      title: "Batch import successful",
      description: `${newStudents.length} Twenty students have successfully imported the system`,
    });
  } catch (error) {
    console.error("Error importing students:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Batch import failed. Please try again.";
    toast({
      title: "Import failed",
      description: errorMessage,
      variant: "destructive",
    });
  }
};

  // Handle submit edited student data
  const handleSubmitEditStudent = async (updatedStudent: Student) => {
    try {
      await studentApi.update(updatedStudent);
      setEditSheetOpen(false);

      // Refresh the student list
      fetchStudents();

      toast({
        title: "Student Updated",
        description: `${updatedStudent.name}'s information has been updated.`,
      });
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete student
  const handleDeleteStudent = async () => {
    if (selectedStudent && selectedStudent.id) {
      try {
        await studentApi.delete(selectedStudent.id);
        setDeleteDialogOpen(false);
        setSelectedStudent(null);

        // Refresh the student list
        fetchStudents();

        toast({
          title: "Student Removed",
          description: "The student has been removed from the system.",
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error deleting student:", error);
        toast({
          title: "Error",
          description: "Failed to delete student. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t('students.search.placeholder')}
                className="pl-8 bg-white shadow-sm border-gray-200"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <Select value={majorFilter} onValueChange={handleMajorFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white shadow-sm border-gray-200">
                <SelectValue placeholder={t('students.filter.major')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('students.filter.all')}</SelectItem>
                  {majors.map((major) => (
                <SelectItem key={major.value} value={major.value}>
                  {t(`students.majors.${major.value}`)}
                </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-md"
            onClick={() => setAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('students.action.add')}
          </Button>
        </div>

        <Card className="border-none shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="rounded-md">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.studentId')}
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.name')}
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.email')}
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.major')}
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.class')}
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium">
                      {t('students.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        {t('students.table.loading')}
                      </TableCell>
                    </TableRow>
                  ) : studentsData.length > 0 ? (
                    studentsData.map((student) => (
                      <TableRow
                        key={student.id}
                        className="hover:bg-blue-50/50"
                      >
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell className="font-medium">
                          {student.name || student.fullName}
                        </TableCell>
                        <TableCell>{student.email || "—"}</TableCell>
                        <TableCell>{student.major}</TableCell>
                        <TableCell>
                          {student.grade || student.enrollmentYear?.toString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="hover:text-blue-600 hover:border-blue-600"
                              onClick={() => {
                                setSelectedStudent(student);
                                setViewSheetOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="hover:text-amber-600 hover:border-amber-600"
                              title={t('students.action.edit')}
                              onClick={() => {
                                setSelectedStudent(student);
                                setEditSheetOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:border-red-600"
                              title={t('students.action.delete')}
                              onClick={() => {
                                setSelectedStudent(student);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        {majorFilter === "all"
                          ? t('students.table.emptyAll')
                          : `{t('students.table.emptyFilter', { major: majorFilter })}`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('students.dialog.addTitle')}</DialogTitle>
          </DialogHeader>
          <StudentForm
            mode="add"
            onSubmit={handleAddStudent}
            onBulkImport={handleBulkImport}
            onExcelImport={handleExcelImport}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('students.dialog.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-500">
              {t('students.dialog.deleteConfirm', {
                name: selectedStudent?.name || selectedStudent?.fullName
              })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteStudent}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Student Details */}
      <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('students.sheet.details')}</SheetTitle>
          </SheetHeader>
          {selectedStudent && (
            <StudentForm
              mode="view"
              student={{
                id: selectedStudent.id || "",
                name: selectedStudent.name || selectedStudent.fullName || "",
                studentId: selectedStudent.studentId,
                email: selectedStudent.email || "",
                studentType:selectedStudent.studentType, 
                gender:
                  selectedStudent.gender === "Not Specified"
                    ? "Other"
                    : (selectedStudent.gender as "Male" | "Female" | "Other"),
                major: selectedStudent.major,
                grade:
                  selectedStudent.grade ||
                  selectedStudent.enrollmentYear?.toString() ||
                  "",
                status:
                  selectedStudent.status === "active"
                    ? "1"
                    : selectedStudent.status === "inactive"
                    ? "2"
                    : "3",
                employmentStatus:
                  selectedStudent.employmentStatus === "Not Specified"
                    ? "Not Employed"
                    : (selectedStudent.employmentStatus as
                        | "Employed"
                        | "Not Employed"),
                 
              }}
              onCancel={() => setViewSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Student */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('students.sheet.edit')}</SheetTitle>
          </SheetHeader>
          {selectedStudent && (
            <StudentForm
              mode="edit"
              student={{
                id: selectedStudent.id || "",
                name: selectedStudent.name || selectedStudent.fullName || "",
                studentId: selectedStudent.studentId,
                email: selectedStudent.email || "",
                major: selectedStudent.major,
                grade:
                  selectedStudent.grade ||
                  selectedStudent.enrollmentYear?.toString() ||
                  "",
             studentType: selectedStudent.isPhd ? 'phd' : selectedStudent.isMaster ? 'master' : 'Bachelor'

              }}
              onSubmit={(data) =>
                handleSubmitEditStudent({
                  ...selectedStudent,
                  // Only update editable fields
                  fullName: data.name,
                  name: data.name,
                  studentId: data.studentId,
                  email: data.email || "",
                  major: data.major,
                  enrollmentYear:
                    parseInt(data.grade) || new Date().getFullYear(),
                  grade: data.grade,
                  studentType: data.studentType // 新增 studentType
                  // Keep existing values for non-editable fields (gender, status, employmentStatus)
                } as Student)
              }
              onCancel={() => setEditSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
};



export default Students;