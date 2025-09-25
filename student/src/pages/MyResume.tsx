
import React, { useState, useEffect } from "react";
import { saveAs } from 'file-saver';
import { ResumeService, ResumeInfo } from "@/api/resume";
import { JobService } from "@/api/job";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileText, Download, Eye, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const MyResume = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [viewingResume, setViewingResume] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // 从后端数据构建的简历列表
  const [resumes, setResumes] = useState<Array<{
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    isActive: boolean;
    url: string;
  }>>([]);

  // 加载简历数据
  const loadResumeData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading resume data...');
      const data = await ResumeService.getResumeInfo();
      console.log('Resume data received:', data);
      setResumeInfo(data);

      if (data.hasResume && data.fileExists) {
        // Extract filename from path
        const fileName = data.resumePath.split('/').pop() || 'resume.pdf';
        const fileSize = data.fileSize ? `${(data.fileSize / (1024 * 1024)).toFixed(1)} MB` : t('myResume.unknownSize');
        const uploadDate = data.lastModified ?
          new Date(data.lastModified).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : t('myResume.unknownDate');

        const resumeObj = {
          id: '1',
          name: fileName,
          size: fileSize,
          uploadedAt: uploadDate,
          isActive: true,
          url: data.resumePath
        };

        console.log('Setting resume object:', resumeObj);
        setResumes([resumeObj]);
      } else {
        console.log('No resume found or file does not exist');
        setResumes([]);
      }
    } catch (error) {
      console.error('Failed to load resume data:', error);
      const errorMessage = error instanceof Error ? error.message : t('myResume.errors.unknown');
      toast.error(t('myResume.toast.loadError'), {
        description: `${t('myResume.errors.loadDescription')}: ${errorMessage}`
      });
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResumeData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    // Check file type - only allow PDF
    if (file.type !== 'application/pdf') {
      toast.error(t('myResume.errors.invalidFileType'), {
        description: t('myResume.errors.pdfOnly')
      });
      return;
    }

    // Check file size (max 10MB, consistent with backend)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('myResume.toast.fileTooLarge'), {
        description: t('myResume.errors.maxFileSize')
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
  // If resume exists, use update API, otherwise use upload API
  const resumeUrl = resumes.length > 0
    ? await ResumeService.updateResume(file)
    : await ResumeService.uploadResume(file);

  console.log('Upload successful, resume URL:', resumeUrl);

  // 加载简历信息（更新 resumeInfo）
  await loadResumeData();

  toast.success(t('myResume.toast.uploadSuccess'), {
    description: t('myResume.toast.uploadSuccessDescription')
  });

  // 获取推荐岗位 —— 注意 resumeInfo 是异步更新的，确保加载完毕后再获取 studentId
  const updatedResumeInfo = await ResumeService.getResumeInfo(); // 如果 loadResumeData 不能返回 resumeInfo，就手动获取
  const studentId = updatedResumeInfo?.studentId;

  if (studentId) {
    try {
      const jobs = await JobService.getRecommendedJobs(studentId);
      console.log("Recommended jobs:", jobs);

      toast.success(t('myResume.toast.jobRecommendationsReady'), {
        description: t('myResume.toast.aiRecommendations')
      });

      // 你可以在这里存入状态或跳转页面展示
      // navigate("/recommended-jobs", { state: jobs });

    } catch (e) {
      console.error("Failed to obtain the recommended job:", e);
      toast.error("Failed to obtain the recommended job", {
        description: "Please try again later"
      });
    }
  } else {
    console.warn("studentId 为空，无法推荐岗位");
  }

} catch (error) {
  console.error('Upload error:', error);
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  toast.error(t('myResume.toast.uploadError'), {
    description: `${t('myResume.errors.uploadFailed')}: ${errorMessage}`
  });

} finally {
  setIsUploading(false);
}

  };



const viewResume = async (url: string) => {
  try {
    setViewingResume(url);

    const segments = url.split('/');
    const fileName = segments.pop(); // 最后一段为文件名
    const studentId = segments[segments.length - 1]; // 倒数第二段为 studentId

    if (!fileName || !studentId) {
      throw new Error('Invalid resume path format');
    }

    const fileUrl = `/api/files/uploads/resumes/${studentId}/${fileName}`;
    window.open(fileUrl, '_blank');

    toast.success(t('myResume.toast.openingResume'), {
      description: t('myResume.toast.openingInNewTab')
    });

  } catch (error) {
    toast.error(t('myResume.toast.openResumeError'), {
      description: error instanceof Error ? error.message : t('myResume.errors.couldNotOpenResume')
    });
  } finally {
    setViewingResume(null);
  }
};


const downloadResume = async (url: string) => {
  try {
    const segments = url.split('/');
    const fileName = segments.pop(); // 最后一段为文件名
    const studentId = segments[segments.length - 1]; // 倒数第二段为 studentId

    if (!fileName || !studentId) {
      throw new Error('Invalid resume path format');
    }

    const fileBlob = await ResumeService.downloadResume(studentId, fileName);
    if (!(fileBlob instanceof Blob)) {
      throw new Error('Invalid file data received');
    }

    saveAs(fileBlob, fileName);

    toast.success("Download started", {
      description: "Your resume is being downloaded"
    });

  } catch (error) {
    toast.error("Failed to download resume", {
      description: error instanceof Error ? error.message : "Could not download the resume file"
    });
  }
};


  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      } 
    },
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 } 
    },
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ios-background py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="mr-3 text-black dark:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-black dark:text-white">My Resume</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadResumeData}
              className="ml-auto text-black dark:text-white"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-background py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button - Updated to black text */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/profile")}
            className="mr-3 text-black dark:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-black dark:text-white">My Resume</h1>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Active Resume Section - Simplified typography and colors */}
          <motion.div variants={itemVariants}>
            <BlurContainer className="p-5" intensity="light">
              <div className="space-y-4">
                <h2 className="text-lg font-medium flex items-center text-black dark:text-white">
                  <FileText className="h-5 w-5 mr-2 text-ios-primary" />
                  <span>Active Resume</span>
                </h2>
                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {resumes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No resume uploaded yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Upload your first resume below</p>
                  </div>
                ) : resumes.filter(resume => resume.isActive).map(resume => (
                  <Card key={resume.id} className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
                        <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mr-3">
                          <FileText className="h-6 w-6 text-ios-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-200">{resume.name}</p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 mt-1">
                            <span>{resume.size}</span>
                            <span>•</span>
                            <span>{resume.uploadedAt}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => viewResume(resume.url)}
                            className="text-gray-600 hover:text-ios-primary dark:text-gray-300 dark:hover:text-ios-primary transition-colors"
                            title="View Resume"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadResume(resume.url)}
                            className="text-gray-600 hover:text-ios-primary dark:text-gray-300 dark:hover:text-ios-primary transition-colors"
                            title="Download Resume"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Hidden file input */}
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </BlurContainer>
          </motion.div>
          
          {/* Upload Section - Simplified typography and colors */}
          <motion.div variants={itemVariants}>
            <BlurContainer className="p-5" intensity="light">
              <h2 className="text-lg font-medium flex items-center text-black dark:text-white mb-3">
                <Upload className="h-5 w-5 mr-2 text-ios-primary" />
                <span>Upload New Resume</span>
              </h2>
              <Separator className="mb-4 bg-gray-200 dark:bg-gray-700" />
              
              <label htmlFor="resume-upload" className="cursor-pointer block">
                <div className="border-2 border-dashed border-gray-200 hover:border-ios-primary/50 dark:border-gray-700 dark:hover:border-ios-primary/50 rounded-lg transition-colors bg-white/20 dark:bg-black/10">
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <div className="h-14 w-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Upload className="h-7 w-7 text-ios-primary" />
                    </div>
                    <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                      {isUploading ? "Uploading..." : "Click to upload"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF up to 10MB
                    </p>
                  </div>
                </div>
              </label>
            </BlurContainer>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyResume;
