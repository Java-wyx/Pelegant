/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:39
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-02 18:55:40
 * @FilePath: \pelegant\src\pages\statistics\PositionsStatistics.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChartBar, 
  BarChart,
  Download, 
  Calendar
} from 'lucide-react';
import TabSwitcher from './components/TabSwitcher';
import PositionOverviewTab from './components/positions/PositionOverviewTab';
import PositionDetailsTab from './components/positions/PositionDetailsTab';

const PositionsStatistics = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Position Statistics</h1>
        <div className="flex items-center space-x-2">
          {/* <Button variant="outline" size="sm" className="h-9">
            <Calendar className="mr-2 h-4 w-4" />
            Select Date Range
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button> */}
        </div>
      </div>
      
      <TabSwitcher 
        defaultTab="overview"
        tabs={[
          {
            value: "overview",
            label: "Overview",
            icon: BarChart,
            content: <PositionOverviewTab />
          },
          {
            value: "details",
            label: "Details",
            icon: ChartBar,
            content: <PositionDetailsTab />
          }
        ]}
      />
    </div>
  );
};

export default PositionsStatistics;
