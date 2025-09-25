import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, transformSchoolFromBackend, transformSchoolToBackend } from './types';
import { api } from '@/lib/api';

// 国家/地区 & 省州数据
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import zhLocale from 'i18n-iso-countries/langs/zh.json';
// 建议直接导入 JSON，避免 CJS/ESM 差异
import rawCountryRegionData from 'country-region-data/data.json';
const COUNTRY_REGION_DATA: any[] = rawCountryRegionData as any[];

countries.registerLocale(enLocale as any);
countries.registerLocale(zhLocale as any);

function listAllCountriesZH() {
  const names = countries.getNames('zh');
  return Object.entries(names).map(([code, name]) => ({ label: name, value: code }));
}

function getSubdivisionsByCountry(code?: string) {
  if (!code) return [] as { value: string; label: string }[];

  // 查找对应的国家数据
  const entry = COUNTRY_REGION_DATA.find((e: any) => {
    const short = Array.isArray(e) ? e[1] : (e?.countryShortCode || e?.countryCode || e?.alpha2 || e?.code);
    return String(short).toUpperCase() === String(code).toUpperCase();
  });

  // 如果没有找到对应的国家，则返回空数组
  if (!entry) return [];

  // 获取该国家的省/州信息
  const regions = Array.isArray(entry) ? entry[2] : entry.regions;

  // 如果regions是一个对象数组，且对象包含shortCode和name字段，处理为[{ value, label }]
  if (Array.isArray(regions) && regions.length && typeof regions[0] === "object") {
    return regions.map((r: any) => ({
      value: String(r.shortCode || r.name),  // 确保value是字符串
      label: r.name,  // 显示名称
    }));
  }

  // 如果regions是以字符串形式存储的，形如"CODE,Name|CODE2,Name2"
  if (typeof regions === 'string') {
    return regions.split('|').map((item: string) => {
      const [short, name] = item.split(',');
      return { value: short || name, label: name || short };  // 确保value是字符串
    });
  }

  // 如果不符合预期的格式，返回空数组
  return [];
}


const EditSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<School>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchoolData = async () => {
      if (!id) {
        toast({ title: '错误', description: '学校ID不存在', variant: 'destructive' });
        navigate('/schools/list');
        return;
      }
      try {
        setLoading(true);
        const response = await api.getSchoolById(id);
        if (response.success && response.data) {
          const transformedSchool = transformSchoolFromBackend(response.data);
          setFormData(transformedSchool);
        } else {
          toast({ title: '加载失败', description: response.message || '无法加载学校信息', variant: 'destructive' });
          navigate('/schools/list');
        }
      } catch (error) {
        console.error('加载学校信息失败:', error);
        toast({ title: '加载失败', description: '网络错误，请重试', variant: 'destructive' });
        navigate('/schools/list');
      } finally {
        setLoading(false);
      }
    };
    loadSchoolData();
  }, [id, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'pending' }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleContinentChange = (value: string) => {
    setFormData(prev => ({ ...prev, continent: value, country: '', region: '' }));
  };

  const handleCountryChange = (value: string) => {
    setFormData(prev => ({ ...prev, country: value, region: '' }));
  };

  const handleRegionChange = (value: string) => {
    setFormData(prev => ({ ...prev, region: value }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!id) {
    toast({ title: '错误', description: '学校ID不存在', variant: 'destructive' });
    return;
  }
  setIsLoading(true);
  try {
    // 转换国家为全称
    const countryName = countries.getName(formData.country, "zh");
    // 根据 region code 查找 region name
    const regionName = formData.region ? regionOptions.find(r => r.value === formData.region)?.label : '';

    const updateData = transformSchoolToBackend({
      ...formData,
      country: countryName,  // 更新为国家全称
      region: regionName,  // 更新为省/州全名
    });

    const response = await api.updateSchool(id, updateData);
    if (response.success) {
      toast({ title: '保存成功', description: '学校信息已成功更新' });
      navigate(`/schools/${id}`);
    } else {
      toast({ title: '保存失败', description: response.message || '更新学校信息时发生错误', variant: 'destructive' });
    }
  } catch (error) {
    console.error('更新学校失败:', error);
    toast({ title: '保存失败', description: '网络错误，请重试', variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};


  const countryOptions = useMemo(() => {
    return Object.entries(countries.getNames("zh")).map(([code, name]) => ({ value: code, label: name }));
  }, []);

  const regionOptions = useMemo(() => {
    return formData.country ? getSubdivisionsByCountry(formData.country) : [];
  }, [formData.country]);

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><p>加载中...</p></div>);
  }

  if (!formData.id) {
    return (<div className="flex items-center justify-center h-64"><p>学校信息未找到</p></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate(`/schools/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">编辑学校信息</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>修改学校的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">学校名称</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">学校类型</Label>
                <Select value={formData.type || ''} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学校类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="综合性大学">综合性大学</SelectItem>
                            <SelectItem value="理工类大学">理工类大学</SelectItem>
                            <SelectItem value="师范类大学">师范类大学</SelectItem>
                            <SelectItem value="农业类大学">农业类大学</SelectItem>
                            <SelectItem value="医药类大学">医药类大学</SelectItem>
                            <SelectItem value="财经类大学">财经类大学</SelectItem>
                            <SelectItem value="艺术类大学">艺术类大学</SelectItem>
                            <SelectItem value="体育类大学">体育类大学</SelectItem>
                            <SelectItem value="语言类大学">语言类大学</SelectItem>
                            <SelectItem value="政法类大学">政法类大学</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 大洲 / 国家 / 省州 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>大洲</Label>
                <Select value={(formData as any).continent || ''} onValueChange={handleContinentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择大洲" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia">亚洲</SelectItem>
                    <SelectItem value="Europe">欧洲</SelectItem>
                    <SelectItem value="North America">北美洲</SelectItem>
                    <SelectItem value="South America">南美洲</SelectItem>
                    <SelectItem value="Africa">非洲</SelectItem>
                    <SelectItem value="Oceania">大洋洲</SelectItem>
                    <SelectItem value="Antarctica">南极洲</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label>国家</Label>
                <Select value={formData.country || ''} onValueChange={handleCountryChange}>
                  <SelectTrigger><SelectValue placeholder="选择国家/地区" /></SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>省/州/地区</Label>
                <Select value={formData.region || ''} onValueChange={handleRegionChange} disabled={!regionOptions.length}>
                  <SelectTrigger><SelectValue placeholder={!formData.country ? "请先选择国家" : (regionOptions.length ? "请选择省/州/地区" : "该国家无省/州数据，可留空")} /></SelectTrigger>
                  <SelectContent>
                    {regionOptions.map(sub => (<SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">位置</Label>
                <Input id="location" name="location" value={formData.location || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">管理员邮箱</Label>
                <Input id="adminEmail" name="adminEmail" type="email" value={formData.adminEmail || ''} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status || ''} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">运行中</SelectItem>
                  <SelectItem value="inactive">暂停招生</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate(`/schools/${id}`)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存更改'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default EditSchool;
