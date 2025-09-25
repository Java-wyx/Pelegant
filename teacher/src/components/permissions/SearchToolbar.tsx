
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchToolbarProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAddClick: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery,
  onAddClick 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { t } = useTranslation();

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const placeholder =
    activeTab === 'roles' ? t('search.placeholder.roles') : t('search.placeholder.users');

  const addLabel =
    activeTab === 'roles' ? t('search.addRole') : t('search.addUser');

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
      <div className="w-full sm:w-auto order-2 sm:order-none">
        <TabsList className="bg-gray-50 p-1 rounded-lg h-auto w-full md:w-auto">
          <TabsTrigger
            value="roles"
            className="px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-sm flex items-center gap-2 flex-1 md:flex-initial"
            onClick={() => setActiveTab('roles')}
          >
            <Shield className="h-4 w-4" />
            <span>{t('search.tabs.roles')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-sm flex items-center gap-2 flex-1 md:flex-initial"
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4" />
            <span>{t('search.tabs.users')}</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className={`relative transition-all ${isSearchFocused ? 'ring-2 ring-blue-200 rounded-md' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder={placeholder}
            className="pl-9 bg-white border-gray-200 focus:border-blue-400 w-full pr-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={handleClearSearch}
              aria-label={t('search.actions.clear')}
              title={t('search.actions.clear')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
          onClick={onAddClick}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
};
