import http from './http';

// Company interface
export interface Company {
  id: number;
  name: string;
  industry: string;
  positions: number;
}

// Pagination parameters interface
export interface PageParams {
  current?: number;
  size?: number;
  name?: string;
  industry?: string;
}

// API response interface
export interface ApiResponse<T> {
  list: T[];
  total: number;
}

// Company API service - 使用教师端API
const companyApi = {
  // Get paginated company data - 使用教师企业查看API
  getPage: async (params: PageParams) => {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('page', (params.current || 0).toString());
      queryParams.append('size', (params.size || 20).toString());

      if (params.name) {
        queryParams.append('search', params.name);
      }
      if (params.industry) {
        queryParams.append('industry', params.industry);
      }

      const response = await http.get(`/api/teachers/companies?${queryParams.toString()}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch companies');
      }

      const companies = response.data.data || [];

      // 转换后端数据格式为前端期望的格式
      const transformedCompanies: Company[] = companies.map((company: any) => ({
        id: company.id,
        name: company.name,
        industry: company.industry,
        positions: company.positions || 0
      }));

      return {
        list: transformedCompanies,
        total: transformedCompanies.length,
        pages: Math.ceil(transformedCompanies.length / (params.size || 20))
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  // Get company by ID - 使用教师企业详情API
  getById: async (id: string): Promise<Company> => {
    try {
      const response = await http.get(`/api/teachers/companies/${id}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch company');
      }

      const company = response.data.data;
      return {
        id: company.id,
        name: company.companyName,
        industry: company.industry,
        positions: 0 // 需要单独查询职位数量
      };
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  // Search companies by name - 使用教师企业搜索API
  searchByName: async (name: string): Promise<Company[]> => {
    try {
      const response = await http.get(`/api/teachers/companies/search?name=${encodeURIComponent(name)}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to search companies');
      }

      const companies = response.data.data || [];
      return companies.map((company: any) => ({
        id: company.id,
        name: company.companyName,
        industry: company.industry,
        positions: 0
      }));
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }
};

export default companyApi;
