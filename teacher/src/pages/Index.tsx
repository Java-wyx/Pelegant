
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Building2, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/store/authStore';

const Index: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { hasPermission } = useAuthStore();
  
  const allManagementCards = [
    {
      title: "Users & Roles",
      description: "Manage system users and permission roles",
      icon: <Shield className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-blue-500`} />,
      path: "/permissions",
      color: "bg-blue-50",
      permission: "system:user:list"
    },
    {
      title: "Student Management",
      description: "Manage student profiles and academic records",
      icon: <Users className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-green-500`} />,
      path: "/students",
      color: "bg-green-50",
      permission: "students.manage"
    },
    {
      title: "Enterprise Management",
      description: "Manage partner companies and opportunities",
      icon: <Building2 className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-purple-500`} />,
      path: "/enterprises",
      color: "bg-purple-50",
      permission: "pelegant:company:query"
    },
    {
      title: "Statistics",
      description: "Review analytics and generate reports",
      icon: <BarChart className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-amber-500`} />,
      path: "/statistics",
      color: "bg-amber-50",
      permission: "statistics.view"
    }
  ];
  
  // 根据用户权限过滤卡片
  const managementCards = allManagementCards.filter(card => 
    !card.permission || hasPermission(card.permission)
  );

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Layout>
      <div className="w-full space-y-6 animate-fade-in">
        <div className="px-2 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">Career Center Management System</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Welcome to the dashboard</p>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {managementCards.map((card) => (
            <Card
              key={card.title}
              className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(card.path)}
            >
              <CardHeader className={`flex flex-row items-center gap-2 sm:gap-4 ${card.color} rounded-t-lg p-3 sm:p-4`}>
                <div className="rounded-full bg-white p-1.5 sm:p-2 shadow-sm">
                  {card.icon}
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-medium">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <CardDescription className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500">
                  {card.description}
                </CardDescription>
                <Button
                  className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the card click event from triggering
                    handleCardClick(card.path);
                  }}
                >
                  Go to {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
