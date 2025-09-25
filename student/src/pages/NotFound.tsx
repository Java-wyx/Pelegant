import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      t('notFound.consoleError', { path: location.pathname }),
      location.pathname
    );
  }, [location.pathname, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-6xl font-bold mb-4 text-gray-800 dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          {t('notFound.message')}
        </p>
        <a 
          href="/" 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors duration-200"
        >
          {t('notFound.returnHome')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
