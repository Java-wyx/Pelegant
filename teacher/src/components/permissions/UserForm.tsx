
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check } from 'lucide-react';
import { fetchRoles } from '@/api/auth';

interface UserFormProps {
  onClose: () => void;
  onSave: (user: { 
    id?: number; 
    username: string; 
    email: string; 
    roleIds: string; 
    status?: number 
  }) => void;
  editUser?: { 
    id?: number; 
    username: string; 
    email: string; 
    roleIds: string; 
    status?: number 
  };
}

export const UserForm: React.FC<UserFormProps> = ({ onClose, onSave, editUser }) => {
  const [formData, setFormData] = useState({
    username: editUser?.username || '',
    email: editUser?.email || '',
    roleIds: editUser?.roleIds || '',
  });
  const [roles, setRoles] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetchRoles(1, 100);
        setRoles(response.list);
      } catch (error) {
        console.error('Failed to load roles', error);
      }
    };
    loadRoles();
  }, []);
  
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    roleIds?: string;
  }>({});
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: {username?: string; email?: string; roleIds?: string} = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.roleIds) {
      newErrors.roleIds = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!validateForm()) return;
    
    try {
      await onSave({
        id: editUser?.id,
        username: formData.username,
        email: formData.email,
        roleIds: formData.roleIds,
     
        status: 1, // Default active status
      });
         console.log(formData)
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-lg font-medium">
          {editUser ? 'Edit User' : 'Add New User'}
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          {showSuccess && !errorMessage && (
            <Alert variant="success" className="mb-4">
              <Check className="h-4 w-4" />
              <AlertDescription>
                User successfully {editUser ? 'updated' : 'created'}!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'border-red-500' : ''}
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="Enter user email"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="roleIds">Role</Label>
            <Select 
              value={formData.roleIds} 
              onValueChange={(value) => handleSelectChange('roleIds', value)}
            >
              <SelectTrigger id="roleIds" className={errors.roleIds ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.name} value={role.name.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleIds && (
              <p className="text-xs text-red-500 mt-1">{errors.roleIds}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit">
            {editUser ? 'Update User' : 'Create User'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
