import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookmarkIcon, CheckIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { JobService } from "@/api/job";
import type { Job } from "@/types/job";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface JobDetailsProps {
  jobId?: string;
  isDrawer?: boolean;
  className?: string;
}

const JobDetails = ({ jobId: propJobId, isDrawer = false, className }: JobDetailsProps) => {
  const { t } = useTranslation();
  const { jobId: paramJobId } = useParams();
  const jobId = propJobId || paramJobId;
  const [job, setJob] = useState<Job | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showApplyButton, setShowApplyButton] = useState(false);

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      <Loader2 className="animate-spin h-8 w-8 text-ios-primary mb-2" />
      <p className="text-muted-foreground">{t('jobDetails.loading')}</p>
    </div>
  );

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="text-center">
        <p className="text-red-500">{message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </div>
    </div>
  );

  const handleTooltipClick = (text: string) => toast.success(`${t('common.content')}：${text}`);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setError(t('jobDetails.error.default'));
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [jobDetails, appliedStatus, savedStatusMap] = await Promise.all([
          JobService.getJobDetails(jobId),
          JobService.isApplied(jobId),
          JobService.getSavedStatusBatch([jobId]),
        ]);
        setJob(jobDetails);
        setIsApplied(appliedStatus.isApplied);
        setIsSaved(savedStatusMap[jobId] || false);
      } catch (err: any) {
        console.error(err);
        const errorMessage = err.message?.includes("404")
          ? t('jobDetails.error.notFound')
          : err.message?.includes("network")
          ? t('jobDetails.error.network')
          : t('jobDetails.error.default');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);
const handleApply = async () => {
  if (!jobId || !job) return;

  // 先打开空窗口，保证浏览器不会拦截
  let newWindow: Window | null = null;
  if (job.jobUrl) {
    newWindow = window.open("", "_blank");
  }

  try {
    const response = await JobService.applyJob(job.id);

    if (response?.success) {
      toast.success(response.data || t('jobDetails.apply.success'));
      setIsApplied(true);

      // 异步完成后再设置 URL
      if (newWindow) {
        newWindow.location.href = job.jobUrl!;
      } else if (job.jobUrl) {
        // 备用方案
        window.open(job.jobUrl, "_blank");
      }
    } else {
      toast.error(t('jobDetails.apply.error'));
      if (newWindow) newWindow.close();
    }
  } catch (error) {
    console.error(error);
    toast.error("Submission failed. Please try again later");
    if (newWindow) newWindow.close();
  }
};

  const handleSave = async () => {
    if (!job) return;
    try {
      await JobService.saveJob(job.id);
      const newSavedStatus = !isSaved;
      setIsSaved(newSavedStatus);
      window.dispatchEvent(
        new CustomEvent("save-status-changed", { detail: { id: job.id, isSaved: newSavedStatus } })
      );
    } catch (error) {
      console.error(error);
      toast.error(t('jobDetails.save.error'));
    }
  };

  // 处理滚动或内容不足时显示按钮
  useEffect(() => {
    const updateApplyButtonVisibility = () => {
      if (!scrollRef.current) return;
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      // 内容不够滚动 → 显示按钮；内容可滚动 → 滚动到底才显示
      if (scrollHeight <= clientHeight) {
        setShowApplyButton(true);
      } else {
        setShowApplyButton(scrollTop + clientHeight >= scrollHeight - 40);
      }
    };

    updateApplyButtonVisibility();

    const current = scrollRef.current;
    current?.addEventListener("scroll", updateApplyButtonVisibility);
    return () => current?.removeEventListener("scroll", updateApplyButtonVisibility);
  }, [job]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
const getAvatarFallback = (companyName?: string) => {
  if (!companyName) return "?";
  
  // 分割公司名称并过滤掉非字母开头的单词
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter(word => /^[A-Za-z]/.test(word)); // 仅保留以字母开头的单词
  
  if (words.length === 0) return "?";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase(); // 单个单词取前两个字符
  }
  // 取前两个字母开头的单词的首字母
  return words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
};
  return (
    <div
      className={cn(
        "py-4 px-4 min-h-[calc(100vh-80px)]",
        isDrawer ? "max-w-full" : "max-w-3xl mx-auto",
        className
      )}
      style={{ maxWidth: isDrawer ? "100%" : 720 }}
    >
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-start mb-4 sticky top-0 bg-background z-10">
          <div
            className="h-14 w-14 mr-4 flex-shrink-0 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer flex items-center justify-center"
            role="button"
            tabIndex={0}
            aria-label={`Visit ${job?.companyName || "company"} website`}
            onClick={() =>
              job?.companyUrl
                ? window.open(job.companyUrl, "_blank")
                : toast.error(t('jobDetails.noCompanyUrl'))
            }
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={job?.logoImage || "/default-logo.png"}
                alt={job?.companyName || t('jobDetails.aboutCompany')}
                className="block h-full w-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-logo.png";
                }}
              />
       <AvatarFallback
  className="font-semibold text-white w-full h-full flex items-center justify-center"
  style={{ backgroundColor: job?.logoBackground || "#e2e2e2" }}
>
  {getAvatarFallback(job?.companyName)}
</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-muted-foreground break-words text-sm"
              title={job?.companyName}
              onClick={() => job?.companyName && handleTooltipClick(job.companyName)}
              style={{ overflowWrap: "anywhere", lineHeight: 1.3, cursor: "pointer" }}
            >
              {job?.companyName || "Unknown Company"}
            </h3>
            <h1
              className="font-semibold mb-1 break-words text-lg"
              title={job?.jobTitle}
              onClick={() => job?.jobTitle && handleTooltipClick(job.jobTitle)}
              style={{ overflowWrap: "anywhere", lineHeight: 1.3, cursor: "pointer" }}
            >
              {job?.jobTitle || "Unknown Job Title"}
            </h1>
          </div>

          <Button
            variant={isSaved ? "default" : "outline"}
            size="icon"
            className={`${isSaved ? "bg-ios-primary hover:bg-ios-primary/90" : ""} h-8 w-8 rounded-full ml-4 flex-shrink-0`}
            onClick={handleSave}
            aria-label={isSaved ? "Cancel collection" : "Have already collected"}
          >
            {isSaved ? <CheckIcon size={16} /> : <BookmarkIcon size={16} />}
          </Button>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <motion.div className="space-y-6 max-w-full pb-20">
            {/* Job Description */}
            <Card>
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold">Job Description</h2>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-full text-muted-foreground break-words overflow-wrap-anywhere">
                <ReactMarkdown>{job?.summary || ""}</ReactMarkdown>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold">Requirements</h2>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-full text-muted-foreground break-words overflow-wrap-anywhere">
                <ReactMarkdown>{(job?.requirements || []).join("\n")}</ReactMarkdown>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card>
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold">Responsibilities</h2>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-full text-muted-foreground break-words overflow-wrap-anywhere">
                <ReactMarkdown>{(job?.responsibilities || []).join("\n")}</ReactMarkdown>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Apply Button */}
        <AnimatePresence>
          {showApplyButton && (
            <motion.div
              className="w-full px-4 mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {isApplied ? (
                <Button
                  className="w-full bg-ios-primary hover:bg-ios-primary/90"
                  onClick={() => job?.jobUrl && window.open(job.jobUrl, "_blank")}
                >
                  Visit the job website
                </Button>
              ) : (
                <Button className="w-full bg-ios-primary hover:bg-ios-primary/90" onClick={handleApply}>
                  Apply Now
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobDetails;
