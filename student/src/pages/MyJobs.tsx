import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobList } from "@/components/job/JobList";
import { JobService } from "@/api/job";
import { type Job } from "@/types/job";
import { toast } from "sonner";

const MyJobs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("applied");
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [displayedSavedJobs, setDisplayedSavedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    applied: true,
    saved: true
  });
  const [isJobListClosed, setIsJobListClosed] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading({ applied: true, saved: true });
      const [appliedJobs, savedJobs] = await Promise.all([
        JobService.getAppliedJobs(),
        JobService.getSavedJobs()
      ]);

      setAppliedJobs(appliedJobs);
      setDisplayedSavedJobs(savedJobs);
      setSavedJobIds(savedJobs.map(job => job.id));
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading({
        applied: false,
        saved: false
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    try {
      await JobService.saveJob(jobId);
      setSavedJobIds((prevIds) =>
        isSaved ? prevIds.filter((id) => id !== jobId) : [...prevIds, jobId]
      );
      // toast.success(
      //   isSaved ? "Job removed from saved" : "Job saved successfully"
      // );
      window.dispatchEvent(
        new CustomEvent("save-status-changed", {
          detail: { jobId, isSaved: !isSaved }
        })
      );
    } catch (error) {
      console.error("Failed to save job:", error);
      toast.error("Failed to save job");
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Job List close callback
  const handleJobListClose = (isClosed: boolean) => {
    setIsJobListClosed(isClosed);
    if (isClosed) {
      fetchJobs();
    }
  };

  // Listen for save-status-changed event to update job lists
  useEffect(() => {
    const handleSaveStatusChanged = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const { jobId, isSaved } = detail;

      setSavedJobIds((prevIds) =>
        isSaved ? [...prevIds, jobId] : prevIds.filter((id) => id !== jobId)
      );

      await fetchJobs();
    };

    window.addEventListener("save-status-changed", handleSaveStatusChanged);
    return () => {
      window.removeEventListener("save-status-changed", handleSaveStatusChanged);
    };
  }, []);

  // Listen for job-details-state-changed event to log modal state and reload on close
  useEffect(() => {
    const handleJobDetailsStateChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const { isOpen, jobId } = detail;
      console.log(`JobDetails modal state: ${isOpen ? "opened" : "closed"} for jobId: ${jobId}`);
      if (!isOpen) {
        window.location.reload(); // Reload page when JobDetails closes
      }
    };

    window.addEventListener("job-details-state-changed", handleJobDetailsStateChanged);
    return () => {
      window.removeEventListener("job-details-state-changed", handleJobDetailsStateChanged);
    };
  }, []);

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-2">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-medium">My Jobs</h1>
      </header>

      <BlurContainer className="overflow-hidden">
        <Tabs
          defaultValue="applied"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="applied">Applied</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="applied" className="pt-4">
            {!loading.applied && appliedJobs.length > 0 ? (
              <JobList
                jobs={appliedJobs}
                savedJobIds={savedJobIds}
                onSaveJob={handleSaveJob}
                showSaveButton={false}
                onJobClose={handleJobListClose}
              />
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-10 px-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="text-xl font-medium mb-2">No applied jobs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start applying to jobs to see them here
                </p>
                <Button onClick={() => navigate('/')}>Find Jobs</Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="pt-4">
            {displayedSavedJobs.length > 0 ? (
              <JobList
                jobs={displayedSavedJobs}
                savedJobIds={savedJobIds}
                onSaveJob={handleSaveJob}
                showCheckmark={false}
                onJobClose={handleJobListClose}
              />
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-10 px-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="text-xl font-medium mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Save jobs to view them later
                </p>
                <Button onClick={() => navigate('/')}>Find Jobs</Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </BlurContainer>

      {isJobListClosed && <p>Job List is closed</p>}
    </div>
  );
};

export default MyJobs;