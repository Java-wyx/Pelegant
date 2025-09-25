import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { JobList } from "@/components/job/JobList";
import { JobService } from "@/api/job";
import { type Job } from "@/types/job";
import { useAuthStore } from "@/stores/auth";

const Home = () => {
  const { userId } = useAuthStore();
  const [forYouJobs, setForYouJobs] = useState<Job[]>([]); // 推荐的工作
  const [savedJobs, setSavedJobs] = useState<Job[]>([]); // 已保存的工作
  const [allJobs, setAllJobs] = useState<Job[]>([]); // 所有的工作
  const [loading, setLoading] = useState({
    forYou: true,
    saved: true,
    allJobs: true,
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [showTabs, setShowTabs] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("for-you"); // 默认选中 "for-you" tab
  const scrollThreshold = 5; // Minimum scroll amount to trigger show/hide

  useEffect(() => {
    const fetchJobs = async () => {
      if (!userId) {
        console.log("User ID not available yet");
        return;
      }

      try {
        console.log("Fetching recommended and saved jobs...");

        const [forYouJobs, savedJobs] = await Promise.all([
          JobService.getRecommendedJobs(),
          JobService.getSavedJobs(),
        ]);

        console.log("Fetched recommended jobs:", forYouJobs); // 调试日志
        console.log("Fetched saved jobs:", savedJobs); // 调试日志

        // 获取所有工作
        const allJobs = await JobService.getAllJobs();

        const mapJobFields = (job: any): Job => ({
          ...job,
          id: job.id || job._id || job.jobId || "",
          location: job.workLocation || job.workLoaction || "", // 👈 修复拼写兼容
          type: job.jobType || "", // 👈 建议加默认值防 undefined
          // 其他字段...
        });

        console.log("Fetched all jobs:", allJobs);
        setAllJobs(allJobs.map(mapJobFields)); // ✅ 用 .map() 转换每个 job

        setForYouJobs(forYouJobs || []);
        setSavedJobs(savedJobs || []);
        setSavedJobIds((savedJobs || []).map((job) => job.id));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        toast.error("Failed to load the work list");
        setForYouJobs([]);
        setSavedJobs([]);
        setAllJobs([]);
      } finally {
        setLoading({
          forYou: false,
          saved: false,
          allJobs: false,
        });
      }
    };

    fetchJobs();
  }, [userId]);

  useEffect(() => {
    if (tabsRef.current) {
      setTabsHeight(tabsRef.current.offsetHeight);
    }

    const handleScroll = () => {
      if (!mainScrollRef.current) return;

      const scrollTop = mainScrollRef.current.scrollTop;
      const scrollDelta = scrollTop - lastScrollTop;

      if (scrollDelta < -scrollThreshold) {
        setShowTabs(true);
      } else if (scrollDelta > scrollThreshold && scrollTop > 20) {
        setShowTabs(false);
      }

      setLastScrollTop(scrollTop);
    };

    const scrollContainer = mainScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    const handleSaveStatusChanged = async (event: Event) => {
      const { detail } = event as CustomEvent;
      const { jobId, isSaved } = detail;

      try {
        if (isSaved) {
          const jobDetails = await JobService.getJobDetails(jobId);
          setSavedJobs((prev) => [...prev, jobDetails]);
          setSavedJobIds((prev) => [...prev, jobId]);
          // toast.success('Job saved successfully');
        } else {
          setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
          setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
          // toast.success('Job removed from saved');
        }
      } catch (error) {
        console.error("Failed to update saved jobs:", error);
        toast.error("Failed to update saved jobs");
      }
    };

    window.addEventListener("save-status-changed", handleSaveStatusChanged);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener(
        "save-status-changed",
        handleSaveStatusChanged
      );
    };
  }, [lastScrollTop]);

  const handleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    try {
      await JobService.saveJob(jobId);
      if (isSaved) {
        setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
        // toast.success('Job removed from saved');
      } else {
        const jobDetails = await JobService.getJobDetails(jobId);
        setSavedJobs((prev) => [...prev, jobDetails]);
        setSavedJobIds((prev) => [...prev, jobId]);
        // toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error("Failed to save job:", error);
      toast.error("Failed to save job");
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (forYouJobs.length === 0) {
      // Show "All" jobs when "For You" list is empty
      // toast.info("Currently showing jobs from the database");
    } else {
      // toast.info("Currently showing recommended jobs");
    }
  }, [forYouJobs]);

  return (
    <div
      className="min-h-screen pt-3 px-4 max-w-md mx-auto"
      ref={mainScrollRef}
    >
      <motion.div
        ref={tabsRef}
        className="sticky top-0 bg-ios-background z-10 pb-2"
        animate={{
          opacity: showTabs ? 1 : 0,
          y: showTabs ? 0 : -tabsHeight,
        }}
        initial={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-50/40 dark:bg-gray-900/5 border border-gray-100/40 dark:border-gray-800/40 rounded-md h-9">
            <TabsTrigger
              value="for-you"
              className="py-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-gray-700 dark:data-[state=active]:text-gray-200 data-[state=active]:font-normal data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:text-gray-500/60 transition-colors"
            >
              For you
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="py-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-gray-700 dark:data-[state=active]:text-gray-200 data-[state=active]:font-normal data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:text-gray-500/60 transition-colors"
            >
              Saved
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {!showTabs && <div style={{ height: tabsHeight }} />}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsContent value="for-you" className="mt-0">
          <JobList
            jobs={
              loading.forYou ? [] : forYouJobs.length ? forYouJobs : allJobs
            } // 如果没有推荐工作，则显示所有工作
            savedJobIds={savedJobIds}
            onSaveJob={handleSaveJob}
            onJobClose={() => {}}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <JobList
            jobs={loading.saved ? [] : savedJobs}
            savedJobIds={savedJobIds}
            onSaveJob={handleSaveJob}
            onJobClose={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
