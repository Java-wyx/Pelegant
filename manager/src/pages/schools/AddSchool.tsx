import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import zhLocale from "i18n-iso-countries/langs/zh.json";
// 兼容不同打包环境的导入方式
import rawCountryRegionData from "country-region-data/data.json";
const CountryRegionData: any[] = rawCountryRegionData as any[];
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// 注册语言
countries.registerLocale(enLocale as any);
countries.registerLocale(zhLocale as any);

// ------------------------------------
// Helpers
// ------------------------------------

// 放在 Helpers 区域里
function getCountryNameZH(code?: string) {
  if (!code) return "";
  // 先中文，找不到 fallback 英文，再找不到就原样返回
  return (
    (countries.getName(code, "zh") as string) ||
    (countries.getName(code, "en") as string) ||
    code
  );
}

/** 通过 国家码 + 地区码 找到地区名称（label） */
function getRegionNameByCode(countryCode?: string, regionCode?: string) {
  if (!countryCode || !regionCode) return "";
  const options = getSubdivisionsByCountry(countryCode);
  // 你的 SelectItem 是用 { value, label }，value 保存 shortCode 或 name
  const hit = options.find(o => String(o.value) === String(regionCode));
  return hit?.label || regionCode; // 找不到就回退为原值
}

function listAllCountriesZH() {
  const names = countries.getNames("zh");
  return Object.entries(names).map(([code, name]) => ({ label: name, value: code }));
}


function getSubdivisionsByCountry(code: string) {
  const list: any[] = Array.isArray(CountryRegionData) ? CountryRegionData : [];
  if (!code) return [];

  // 兼容两种结构：
  // 1) 旧数组: [countryName, countryShortCode, regions]
  // 2) 新对象: { countryName, countryShortCode, regions }
  const getShortCode = (e: any) =>
    Array.isArray(e)
      ? e[1]
      : (e?.countryShortCode || e?.countryCode || e?.alpha2 || e?.code);

  const entryRaw = list.find(
    (e: any) => String(getShortCode(e)).toUpperCase() === String(code).toUpperCase()
  );
  if (!entryRaw) return [];

  const regions =
    Array.isArray(entryRaw) ? entryRaw[2] : (entryRaw as any).regions;

  // 1) 对象数组: [{ name, shortCode }]
  if (Array.isArray(regions) && regions.length && typeof regions[0] === "object") {
    return regions.map((r: any) => ({
      value: r.shortCode || r.name,
      label: r.name,
    }));
  }

  // 2) 旧字符串: "CODE,Name|CODE2,Name2"
  if (typeof regions === "string") {
    return regions.split("|").map((item: string) => {
      const [short, name] = item.split(",");
      return { value: short || name, label: name || short };
    });
  }

  // 3) 空或未知格式
  return [];
}


// ------------------------------------
// Zod Schema
// ------------------------------------
const formSchema = z.object({
  name: z.string().min(2, { message: "大学名称至少需要2个字符" }),
  type: z.string({ required_error: "请选择大学类型" }),
  location: z.string().min(2, { message: "地址至少需要2个字符" }),
  adminEmail: z.string().email({ message: "请输入有效的管理员电子邮箱" }),
  status: z.enum(["active", "inactive", "pending"], { required_error: "请选择学校状态" }).default("pending"),
  description: z.string().optional(),
  website: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), { message: "请输入以 http(s):// 开头的链接" }),
  continent: z.string({ required_error: "请选择大学大洲" }),
  country: z.string({ required_error: "请选择国家" }),
  region: z.string().optional(),
});

// ------------------------------------
// Component
// ------------------------------------
const AddSchool = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      adminEmail: "",
      status: "pending",
      website: "",
      description: "",
      continent: "",
      country: "",
      region: "",
    },
  });

  const selectedCountry = form.watch("country");
  const countryOptions = useMemo(() => listAllCountriesZH(), []);
  const regionOptions = useMemo(() => (selectedCountry ? getSubdivisionsByCountry(selectedCountry) : []), [selectedCountry]);

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  setIsSubmitting(true);
  try {
    // 1) 代码 → 名称
    const countryNameZH = getCountryNameZH(values.country);
    const regionName = getRegionNameByCode(values.country, values.region);

    // 2) 组织后端需要的数据（建议同时保留 code，便于以后回显/统计）
    const schoolData = {
      // —— 你的原字段 —— //
      universityName: values.name,
      universityType: values.type,
      universityAddress: values.location,
      adminEmail: values.adminEmail,
      universityWebsite: values.website || "https://example.com",
      status: values.status,
      universityDescription: values.description || "暂无描述",
      continent: values.continent,

      // —— 国家/地区：名称 + 代码（按你的后端需求选用/都发） —— //
      country: countryNameZH,          // <— 全称（中文）
      countryCode: values.country,     // <— ISO 代码（可选）

      // —— 省/州：名称 + 代码（按你的后端需求选用/都发） —— //
      region: regionName || "",        // <— 全称
      regionCode: values.region || "", // <— 短码/编号（可选）
    };

    const response = await api.createSchool(schoolData);
    if (response.success) {
      toast({ title: "添加成功", description: `大学 "${values.name}" 已成功添加` });
      navigate("/schools/list");
    } else {
      toast({ title: "添加失败", description: response.message || "添加学校失败", variant: "destructive" });
    }
  } catch (error) {
    console.error(error);
    toast({ title: "添加失败", description: "网络错误，请重试", variant: "destructive" });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return toast({ title: "请先选择文件", variant: "destructive" });
    setIsUploading(true);
    try {
      const response = await api.importSchoolsExcel(uploadedFile);
      if (response.success) {
        toast({ title: "导入成功", description: `成功导入 ${response.data.successCount} 所学校` });
        setUploadedFile(null);
        navigate("/schools/list");
      } else {
        toast({ title: "导入失败", description: response.message || "导入失败", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "导入失败", description: "网络错误，请稍后重试", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/schools/list")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <GraduationCap className="mr-2 h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">添加大学</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 w-full">
          <TabsTrigger value="single" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> 单个添加
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> 批量导入
          </TabsTrigger>
        </TabsList>

        {/* 单个添加 */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>大学信息</CardTitle>
              <CardDescription>带 * 为必填项</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 大学名称 */}
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>大学名称 *</FormLabel>
                        <FormControl><Input placeholder="输入大学名称" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 大学类型 */}
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>大学类型 *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="选择大学类型" /></SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 大洲（目前仅作占位，不做过滤） */}
                    <FormField control={form.control} name="continent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>大洲 *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="选择大洲" /></SelectTrigger>
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
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 国家/区域 */}
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FormLabel>国家/区域 *</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("region", "");
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="选择国家/区域" />
                            </SelectTrigger>
                            <SelectContent className="w-full max-h-60 overflow-auto">
                              {countryOptions.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 省/州/地区（根据国家联动） */}
                    <FormField control={form.control} name="region" render={({ field }) => (
                      <FormItem>
                        <FormLabel>省/州/地区</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedCountry || regionOptions.length === 0}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={!selectedCountry ? "请先选择国家" : (regionOptions.length ? "请选择省/州/地区" : "该国家无省/州数据，可留空")} />
                            </SelectTrigger>
                            <SelectContent className="w-full max-h-60 overflow-auto">
                              {regionOptions.map((sub) => (
                                <SelectItem key={sub.value} value={sub.value}>
                                  {sub.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>部分国家可能没有省/州数据，可留空</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 地址 */}
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>地址 *</FormLabel>
                        <FormControl><Input placeholder="输入大学地址" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 管理员邮箱 */}
                    <FormField control={form.control} name="adminEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>管理员邮箱 *</FormLabel>
                        <FormControl><Input placeholder="输入管理员邮箱" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 网站 */}
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>网站</FormLabel>
                        <FormControl><Input placeholder="https://…" {...field} /></FormControl>
                        <FormDescription>选填，需以 http(s):// 开头</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* 状态 */}
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>状态 *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue placeholder="选择学校状态" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">运行中</SelectItem>
                            <SelectItem value="inactive">暂停招生</SelectItem>
                            <SelectItem value="pending">待审核</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* 简介 */}
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>大学简介</FormLabel>
                      <FormControl><Textarea className="min-h-32" placeholder="输入大学简介" {...field} /></FormControl>
                      <FormDescription>选填，简要描述大学情况、特色专业等</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate("/schools/list")}>取消</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      保存
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 批量导入 */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>批量导入学校</CardTitle>
              <CardDescription>通过上传Excel文件批量添加多所大学</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg border-dashed border-gray-300 p-10 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <h3 className="font-medium">上传Excel文件</h3>
                  <p className="text-sm text-muted-foreground">支持 .xlsx 和 .xls 格式</p>
                </div>
                <div className="mt-4 w-full max-w-sm mx-auto">
                  <label htmlFor="excel-upload" className="w-full">
                    <Button variant="outline" className="w-full cursor-pointer flex items-center justify-center" asChild>
                      <div><Upload className="mr-2 h-4 w-4" /> 选择文件</div>
                    </Button>
                    <input id="excel-upload" type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {uploadedFile && (
                <div className="p-4 bg-muted rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => navigate("/schools/list")}>取消</Button>
              <Button disabled={!uploadedFile || isUploading} onClick={handleFileUpload}>
                {isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在导入...</>) : (<><Upload className="mr-2 h-4 w-4" /> 开始导入</>)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddSchool;
