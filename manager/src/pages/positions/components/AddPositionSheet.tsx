
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AddPositionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddPositionSheet = ({ open, onOpenChange }: AddPositionSheetProps) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const form = useForm({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      type: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleImportSubmit = () => {
    // Handle Excel import logic here
    if (selectedFile) {
      // Process file
      console.log('Importing file:', selectedFile.name);
      onOpenChange(false);
      // Show success message
    }
  };

  const handleSingleSubmit = (data: any) => {
    console.log('Form data:', data);
    // Redirect to new position form page for detailed information
    navigate('/positions/new');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>添加职位</SheetTitle>
          <SheetDescription>
            批量导入职位或者单独添加一个职位
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Excel批量导入</TabsTrigger>
              <TabsTrigger value="single">单个新增</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="mt-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      点击上传Excel文件或拖拽文件到此处
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2"
                    >
                      选择文件
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="mt-4 text-sm">
                      已选择: {selectedFile.name}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>支持.xlsx和.xls格式，请确保文件包含必要字段：职位名称、企业名称、工作地点等</p>
                  <a href="#" className="text-primary underline">下载模板</a>
                </div>
              </div>
              
              <SheetFooter className="mt-6">
                <Button onClick={handleImportSubmit} disabled={!selectedFile}>
                  导入
                </Button>
              </SheetFooter>
            </TabsContent>
            
            <TabsContent value="single" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSingleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>职位名称</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入职位名称" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属企业</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入企业名称" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>工作地点</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入工作地点" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>职位类型</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入职位类型" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <SheetFooter>
                    <Button type="submit">继续填写详细信息</Button>
                  </SheetFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddPositionSheet;
