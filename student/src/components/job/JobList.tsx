import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { JobCard } from "./JobCard";
import { Job } from "@/types/job";
import { VersionUtils } from "@/utils/version"; // ✅ 引入版本工具

interface JobListProps {
  jobs: Job[];
  savedJobIds: string[];
  onSaveJob: (id: string) => void;
  showSaveButton?: boolean;
  showCheckmark?: boolean;
  onJobClose: (isClosed: boolean) => void;
}

export const JobList = ({
  jobs,
  savedJobIds,
  onSaveJob,
  showSaveButton = true,
  showCheckmark = true,
  onJobClose,
}: JobListProps) => {
  const navigate = useNavigate();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfScrollable = () => {
      if (!scrollContainerRef.current) return;
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollIndicator(scrollHeight > clientHeight);
    };
    checkIfScrollable();

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const scrollTop = scrollContainerRef.current.scrollTop;
      const scrollHeight = scrollContainerRef.current.scrollHeight;
      const clientHeight = scrollContainerRef.current.clientHeight;

      if (scrollTop > 20) setShowScrollIndicator(false);
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
    };

    const scrollContainer = scrollContainerRef.current;
    scrollContainer?.addEventListener("scroll", handleScroll);
    return () => scrollContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  const handleJobClick = (jobId: string) => {
    onJobClose(true);
    navigate(`/job-details/${jobId}`);
  };

  return (
    <div className="relative">
      <div
        className="overflow-y-auto max-h-[calc(100vh-140px)] pb-4"
        ref={scrollContainerRef}
        style={{
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {jobs.map((job, index) => {
          // ✅ 给 logoImage 加上版本号（防缓存）
          const logoImageWithVersion = job.logoImage
            ? VersionUtils.generateCacheBusterUrl(job.logoImage)
            : null;

          return (
            <motion.div
              key={job.id || `job-${index}-${job.companyName}-${job.jobTitle}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <JobCard
                {...job}
                logoImage={logoImageWithVersion} // ✅ 使用带版本号的 logo
                isSaved={savedJobIds.includes(job.id)}
                onSave={onSaveJob}
                onClick={() => handleJobClick(job.id)}
              />
            </motion.div>
          );
        })}
      </div>

      {showScrollIndicator && !isAtBottom && (
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-ios-primary"
          initial={{ opacity: 1 }}
          animate={{ opacity: [0.5, 1, 0.5], y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
        >
          <ChevronDown size={20} />
        </motion.div>
      )}
    </div>
  );
};
