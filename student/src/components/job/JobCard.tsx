import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, CheckIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import JobDetail from "@/pages/JobDetails";
import { VersionUtils } from "@/utils/version"; // 导入版本工具

interface JobCardProps {
  companyName: string;
  jobTitle: string;
  companyLogo: string;
  logoImage?: string | null;
  logoBackground?: string;
  location: string;
  salary: string;
  type: string;
  id: string;
  isSaved: boolean;
  onSave: (id: string) => void;
  showSaveButton?: boolean;
  showCheckmark?: boolean;
}

export const JobCard = ({
  companyName,
  jobTitle,
  companyLogo,
  logoImage,
  logoBackground,
  location,
  salary,
  type,
  id,
  isSaved,
  onSave,
  showSaveButton = true,
  showCheckmark = true,
}: JobCardProps) => {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false); // 修正：应该是 imageError

  const handleClick = () => {
    if (open) {
      return;
    }
    setOpen(true);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    onSave(id);
  };

  const handleImageError = () => {
    setImageError(true); // 修正：设置 imageError 而不是 RangeError
  };

  // 使用版本工具生成防缓存URL - 修正：!imageError 而不是 !RangeError
  const logoImageWithCacheBuster = logoImage && !imageError ? 
    VersionUtils.generateCacheBusterUrl(logoImage) : 
    null;

  // Determine if we should show the button
  const shouldShowButton =
    (isSaved && showCheckmark) || (!isSaved && showSaveButton);


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
      className="py-5 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 px-2 transition-colors rounded-md"
      onClick={handleClick}
    >
      <div className="flex items-center">
        <div className="h-12 w-12 mr-4 flex-shrink-0 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <Avatar className="h-full w-full">
            {logoImageWithCacheBuster ? (
              <AvatarImage
                src={logoImageWithCacheBuster}
                alt={companyName}
                className="object-contain p-1"
                onError={handleImageError} // 添加错误处理
              />
            ) : null}
<AvatarFallback
  className="font-medium text-white w-full h-full flex items-center justify-center"
  style={{ backgroundColor: logoBackground || "#e2e2e2" }}
>
  {getAvatarFallback(companyName)}
</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <div className="overflow-hidden">
              <h4
                className="text-base font-normal text-foreground mb-0.5"
                style={{
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  lineHeight: "1.4",
                  overflow: "hidden",
                }}
              >
                {jobTitle}
              </h4>
              <h3
                className="text-sm font-normal text-muted-foreground mb-1"
                style={{
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  lineHeight: "1.4",
                  overflow: "hidden",
                }}
              >
                {companyName}
              </h3>
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <span>{location}</span>
                {type && <span>• {type}</span>}
                {salary && <span>• {salary}</span>}
              </div>
            </div>
            {shouldShowButton && (
              <Button
                variant={isSaved ? "default" : "outline"}
                size="icon"
                className={`${
                  isSaved ? "bg-ios-primary hover:bg-ios-primary/90" : ""
                } h-8 w-8 rounded-full flex-shrink-0`}
                onClick={handleSaveClick}
                title={isSaved ? "Saved" : "Save"}
              >
                {isSaved ? <CheckIcon size={14} /> : <BookmarkIcon size={14} />}
              </Button>
            )}
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Job Details</SheetTitle>
          </SheetHeader>
          <JobDetail jobId={id.toString()} />
        </SheetContent>
      </Sheet>
    </div>
  );
};