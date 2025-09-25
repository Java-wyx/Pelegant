
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import statisticsApi, {
  StudentApplicationStatsResponse,
  CompanyApplicationStatsResponse,
  GradeStats,
  MajorStats,
  CompanyStats
} from "@/api/statistics";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';


const Statistics: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<StudentApplicationStatsResponse | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyApplicationStatsResponse | null>(null);
  const { t } = useTranslation();


  // Fetch statistics data
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [studentData, companyData] = await Promise.all([
          statisticsApi.getStudentApplicationStats(),
          statisticsApi.getCompanyApplicationStats()
        ]);

        setStudentStats(studentData);
        setCompanyStats(companyData);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        const errorMessage = err instanceof Error ? err.message : t('statistics.error.fetch');
        setError(errorMessage);
        toast({ title: t('statistics.common.error'), description: errorMessage, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [toast]);
  

  // Transform data for display
  const studentGradeData = studentStats?.gradeStats.map(stat => ({
    grade: stat.grade,
    internships: stat.internshipApplications,
    fullTime: stat.fullTimeApplications
  })) || [];

  const studentMajorData = studentStats?.majorStats.map(stat => ({
    major: stat.major,
    internships: stat.internshipApplications,
    fullTime: stat.fullTimeApplications
  })) || [];

// Sort and filter companies by applications, excluding those with 0 applications
const topInternshipCompanies = companyStats?.companyStats
  .filter(stat => stat.internshipApplications > 0)  // Filter out companies with 0 internship applications
  .sort((a, b) => b.internshipApplications - a.internshipApplications)  // Sort by applications
  .slice(0, 10)  // Take top 10 companies
  .map(stat => ({
    company: stat.companyName,
    applications: stat.internshipApplications
  })) || [];

const topFullTimeCompanies = companyStats?.companyStats
  .filter(stat => stat.fullTimeApplications > 0)  // Filter out companies with 0 full-time applications
  .sort((a, b) => b.fullTimeApplications - a.fullTimeApplications)  // Sort by applications
  .slice(0, 10)  // Take top 10 companies
  .map(stat => ({
    company: stat.companyName,
    applications: stat.fullTimeApplications
  })) || [];

  
  // Functions to render responsive tables
  const renderCompanyTable = (companies: {company: string, applications: number}[], badgeColor: string) => (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table>
        <TableHeader className="bg-blue-50/70">
          <TableRow>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.rank')}</TableHead>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.company')}</TableHead>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.applications')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company, index) => (
            <TableRow key={company.company} className="hover:bg-blue-50/30">
              <TableCell className="whitespace-nowrap">
                {index < 3 ? (
                  <Badge className={`
                    ${index === 0 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}
                    ${index === 1 ? "bg-slate-100 text-slate-800 hover:bg-slate-100" : ""}
                    ${index === 2 ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : ""}
                    border-none font-bold
                  `}>
                    #{index + 1}
                  </Badge>
                ) : (
                  <span className="text-gray-500 font-medium">#{index + 1}</span>
                )}
              </TableCell>
              <TableCell className="font-medium text-gray-600 whitespace-nowrap">{company.company}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${badgeColor === 'green' ? 'text-green-600 border-green-200 bg-green-50' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>
                    {company.applications}
                  </Badge>
                  <div className={`w-${isMobile ? '16' : '24'} h-2 bg-gray-100 rounded-full hidden sm:block`}>
                    <div 
                      className={`h-full ${badgeColor === 'green' ? 'bg-green-500' : 'bg-blue-500'} rounded-full`}
                      style={{ width: `${(company.applications / (badgeColor === 'green' ? 350 : 300)) * 100}%` }} 
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderDistributionTable = (data: any[], type: 'grade' | 'major', maxInternship: number, maxFullTime: number) => (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table>
        <TableHeader className="bg-blue-50/70">
          <TableRow>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{type === 'grade' ? t('statistics.table.grade') : t('statistics.table.major')}</TableHead>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.intern')}</TableHead>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.fullTime')}</TableHead>
            <TableHead className="text-gray-700 font-semibold whitespace-nowrap">{t('statistics.table.total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item[type]} className="hover:bg-blue-50/30">
              <TableCell className="font-medium text-gray-600 whitespace-nowrap">{item[type]}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    {item.internships}
                  </Badge>
                  <div className={`w-${isMobile ? '16' : '24'} h-2 bg-gray-100 rounded-full hidden sm:block`}>
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(item.internships / maxInternship) * 100}%` }} 
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    {item.fullTime}
                  </Badge>
                  <div className={`w-${isMobile ? '16' : '24'} h-2 bg-gray-100 rounded-full hidden sm:block`}>
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${(item.fullTime / maxFullTime) * 100}%` }} 
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-semibold whitespace-nowrap">{item.internships + item.fullTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">{t('statistics.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-medium">{t('statistics.error.title')}</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('statistics.actions.retry')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // No data state
  if (!studentStats || !companyStats) {
    return (
      <Layout>
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-gray-500 text-lg font-medium">{t('statistics.empty.title')}</div>
            <p className="text-gray-600">{t('statistics.empty.desc')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Main tabs for student vs enterprise data */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className={`w-full bg-blue-50/70 p-2 rounded-lg mb-4 ${isMobile ? 'flex' : ''}`}>
            <TabsTrigger value="students" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-career-blue px-4 py-3 text-sm md:text-base font-medium">
              {isMobile ? t('statistics.tabs.students.short') : t('statistics.tabs.students.long')}
            </TabsTrigger>
            <TabsTrigger value="enterprises" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-career-blue px-4 py-3 text-sm md:text-base font-medium">
              {isMobile ? t('statistics.tabs.enterprises.short') : t('statistics.tabs.enterprises.long')}
            </TabsTrigger>
          </TabsList>
          
          {/* Student Statistics Tab */}
          <TabsContent value="students" className="space-y-6 animate-fade-in">
            {/* Sub-tabs for grade vs major */}
            <Tabs defaultValue="grade" className="space-y-6">
              <TabsList className="inline-flex w-auto bg-gray-100/70 p-1 rounded-lg">
                <TabsTrigger value="grade" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 py-2">
                  {t('statistics.studentTabs.byGrade')}
                </TabsTrigger>
                <TabsTrigger value="major" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 py-2">
                  {t('statistics.studentTabs.byMajor')}
                </TabsTrigger>
              </TabsList>

              {/* Grade tab content */}
              <TabsContent value="grade" className="space-y-6 animate-fade-in">
                {/* By Grade Detail Table - Now full width */}
                <Card className="shadow-md border-blue-50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-700">{t('statistics.studentCards.gradeDistribution')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {renderDistributionTable(studentGradeData, 'grade', 500, 500)}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Major tab content - Now full width table */}
              <TabsContent value="major" className="space-y-6 animate-fade-in">
                {/* By Major Detail Table */}
                <Card className="shadow-md border-blue-50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-700">{t('statistics.studentCards.majorDistribution')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {renderDistributionTable(studentMajorData, 'major', 600, 400)}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* Enterprise Statistics Tab */}
          <TabsContent value="enterprises" className="space-y-6 animate-fade-in">
            {/* Sub-tabs for internship vs full-time */}
            <Tabs defaultValue="full-time" className="space-y-6">
              <TabsList className="inline-flex w-auto bg-gray-100/70 p-1 rounded-lg">
                <TabsTrigger value="full-time" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 py-2">
                  {isMobile ? t('statistics.companyTabs.fullTime.short') : t('statistics.companyTabs.fullTime.long')}
                </TabsTrigger>
                <TabsTrigger value="internship" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 px-4 py-2">
                  {isMobile ? t('statistics.companyTabs.intern.short') : t('statistics.companyTabs.intern.long')}
                </TabsTrigger>
              </TabsList>

              {/* Full-Time tab content */}
              <TabsContent value="full-time" className="space-y-6 animate-fade-in">
                {/* Top Full-Time Companies */}
                <Card className="shadow-md border-blue-50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-700">{t('statistics.companyCards.topFullTime')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {renderCompanyTable(topFullTimeCompanies, 'green')}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Internship tab content */}
              <TabsContent value="internship" className="space-y-6 animate-fade-in">
                {/* Top Internship Companies */}
                <Card className="shadow-md border-blue-50 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-700">{t('statistics.companyCards.topIntern')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {renderCompanyTable(topInternshipCompanies, 'blue')}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Statistics;
