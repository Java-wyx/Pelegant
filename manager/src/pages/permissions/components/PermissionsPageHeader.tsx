
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PermissionsPageHeaderProps {
  title: string;
  description: string;
  addButtonText: string;
  addButtonPath: string;
}

const PermissionsPageHeader = ({
  title,
  description,
  addButtonText,
  addButtonPath,
}: PermissionsPageHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={() => navigate(addButtonPath)}>
          <Plus className="mr-2 h-4 w-4" />
          {addButtonText}
        </Button>
      </div>
    </CardHeader>
  );
};

export default PermissionsPageHeader;
