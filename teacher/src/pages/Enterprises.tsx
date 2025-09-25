import React, { useState, useEffect } from 'react';
import companyApi, { Company } from '@/api/company';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';


const Enterprises: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allIndustries, setAllIndustries] = useState<string[]>([]); // Store all industries here
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Fetch companies with search and filter parameters
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        current: 0,
        size: 100, // 获取更多数据用于前端筛选
        ...(searchQuery && { name: searchQuery }),
        ...(industryFilter !== 'all' && { industry: industryFilter })
      };

      const response = await companyApi.getPage(params);
      setCompanies(response.list);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : '获取企业数据失败，请重试');
      setCompanies([]); // 清空数据
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch industries and save them independently
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await companyApi.getPage({ current: 0, size: 100 }); // Call once to get all industries
        const industries = [...new Set(response.list.map((company) => company.industry))];
        setAllIndustries(industries); // Save all industries here
      } catch (err) {
        console.error('Error fetching industries:', err);
      }
    };

    fetchIndustries();
  }, []); // Only run this once when the component mounts

  // Debounced search - 当搜索条件改变时重新获取数据
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, industryFilter]);

  // 后端已经处理了搜索和筛选，这里直接使用返回的数据
  const filteredEnterprises = companies;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in p-1">
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-white">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={t('enterprise.searchPlaceholder')}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('enterprise.filterPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('enterprise.allIndustries')}</SelectItem>
                    {allIndustries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold">{t('enterprise.table.companyName')}</TableHead>
                    <TableHead className="font-semibold">{t('enterprise.table.industry')}</TableHead>
                    <TableHead className="font-semibold">{t('enterprise.table.openPositions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredEnterprises.length > 0 ? (
                    filteredEnterprises.map((company) => (
                      <TableRow key={company.id} className="hover:bg-gray-50 border-t">
                        <TableCell className="font-medium">
                          {company.name}
                        </TableCell>
                        <TableCell>{company.industry}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            company.positions > 0 
                              ? "bg-green-100 text-green-800 font-medium" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {company.positions}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <Search className="h-10 w-10 text-gray-300 mb-2" />
                          <p>{t('enterprise.noRecords')}</p>
                          <p className="text-sm mt-1">{t('enterprise.tryAdjust')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Enterprises;
