import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowUpDown, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Student } from "../types";
import { useToast } from "@/hooks/use-toast";

interface StudentsTableProps {
  filteredStudents: Student[];
  selectedStudents: number[];
  handleSelectAll: () => void;
  handleSelectStudent: (id: number) => void;
  handleDelete: (id: number) => void;
  handleDownloadResumes: () => void;
}

const StudentsTable = ({
  filteredStudents,
  selectedStudents,
  handleSelectAll,
  handleSelectStudent,
  handleDelete,
  handleDownloadResumes,
}: StudentsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 查看简历功能
  const viewResume = (studentData: Student) => {
    if (!studentData.resume) {
      toast({
        title: "无法查看简历",
        description: "该学生尚未上传简历",
      });
      return;
    }

    try {
      let fileUrl: string;
      const backendUrl = window.location.origin.replace(/:\d+$/, ":8080"); // 将端口替换为后端端口
      const resumeFile = `${backendUrl}/api/files${studentData.resume.replace(
        /\\/g,
        "/"
      )}`;

      fileUrl = resumeFile;

      // 在新窗口中打开简历
      window.open(fileUrl, "_blank");
    } catch (error) {
      console.error("查看简历失败:", error);
      toast({
        title: "查看简历失败",
        description: "无法访问简历文件，请稍后重试",
      });
    }
  };

  const hasSelectedWithResumes =
    selectedStudents.length > 0 &&
    filteredStudents.some(
      (student) => selectedStudents.includes(student.id) && student.resume
    );

  const getStatusBadge = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 border-green-200"
          >
            在读
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-600 border-gray-200"
          >
            休学
          </Badge>
        );
      case "graduate":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 border-blue-200"
          >
            已毕业
          </Badge>
        );
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      {selectedStudents.length > 0 && (
        <div className="flex items-center justify-between py-2 px-2 bg-muted/20 rounded-md">
          <div className="text-sm">
            已选择{" "}
            <span className="font-medium">{selectedStudents.length}</span>{" "}
            名学生
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={handleDownloadResumes}
              disabled={!hasSelectedWithResumes}
            >
              <Download className="h-4 w-4" />
              下载简历
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedStudents.length === filteredStudents.length &&
                    filteredStudents.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>学生姓名</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>性别</TableHead>
              <TableHead>所属大学</TableHead>
              <TableHead>专业</TableHead>
              <TableHead>年级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>简历</TableHead>
              <TableHead>激活状态</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  没有找到匹配的大学生
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleSelectStudent(student.id)}
                      aria-label={`Select ${student.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.university}</TableCell>
                  <TableCell>{student.major}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    {student.resume ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewResume(student)}
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                    ) : (
                      <span className="text-gray-400">无</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.isFirstLogin ? "未激活" : "已激活"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentsTable;
