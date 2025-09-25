
import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { LucideIcon } from 'lucide-react';

interface TabConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface TabSwitcherProps {
  defaultTab: string;
  tabs: TabConfig[];
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ 
  defaultTab, 
  tabs 
}) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center">
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TabSwitcher;
