
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    { title: t('dashboard.stats.totalStudents'), value: "2,546", change: "+12%", description: t('dashboard.stats.vs.lastMonth') },
    { title: t('dashboard.stats.enterprisePartners'), value: "187", change: "+5%", description: t('dashboard.stats.vs.lastQuarter') },
    { title: t('dashboard.stats.employmentRate'), value: "92.3%", change: "+2.1%", description: t('dashboard.stats.vs.lastYear') },
    { title: t('dashboard.stats.internshipPositions'), value: "421", change: "+17%", description: t('dashboard.stats.vs.lastMonth') },
  ];  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.hero.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.hero.subtitle')}</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change} {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('dashboard.cards.majorDistribution')}</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: t('dashboard.majors.cs'), value: 35 },
                { label: t('dashboard.majors.ee'), value: 27 },
                { label: t('dashboard.majors.finance'), value: 22 },
                { label: t('dashboard.majors.marketing'), value: 16 }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('dashboard.cards.industrySectors')}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: t('dashboard.sectors.it'), value: 38 },
                { label: t('dashboard.sectors.finance'), value: 24 },
                { label: t('dashboard.sectors.education'), value: 20 },
                { label: t('dashboard.sectors.healthcare'), value: 18 }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('dashboard.cards.monthlyEmployment')}</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: t('dashboard.periods.janFeb'), value: 45 },
                { label: t('dashboard.periods.marApr'), value: 62 },
                { label: t('dashboard.periods.mayJun'), value: 78 },
                { label: t('dashboard.periods.julAug'), value: 86 }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
