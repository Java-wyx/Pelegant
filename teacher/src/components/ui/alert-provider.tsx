
import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info';

interface AlertOptions {
  duration?: number;
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: <CheckCircle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />
};

const defaultDurations = {
  success: 3000,
  error: 4000,
  info: 3500
};

export function useAlert() {
  const showAlert = (
    type: AlertType,
    message: string,
    options?: AlertOptions
  ) => {
    const duration = options?.duration || defaultDurations[type];

    const toastOptions: any = {
      duration,
      icon: icons[type],
    };

    if (options?.description) {
      toastOptions.description = options.description;
    }

    if (options?.action) {
      toastOptions.action = options.action;
    }

    return toast[type](message, toastOptions);
  };

  return {
    success: (message: string, options?: AlertOptions) => 
      showAlert('success', message, options),
    error: (message: string, options?: AlertOptions) => 
      showAlert('error', message, options),
    info: (message: string, options?: AlertOptions) => 
      showAlert('info', message, options)
  };
}
