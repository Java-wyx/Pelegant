
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";

// Schools
import SchoolsList from "./pages/schools/SchoolsList";
import AddSchool from "./pages/schools/AddSchool";
import SchoolDetail from "./pages/schools/SchoolDetail";
import EditSchool from "./pages/schools/EditSchool";

// Students
import StudentsList from "./pages/students/StudentsList";
import StudentDetail from "./pages/students/StudentDetail";
import AddStudent from "./pages/students/AddStudent";
import ResumeViewer from "./pages/students/ResumeViewer";

// Enterprises
import EnterprisesList from "./pages/enterprises/EnterprisesList";
import AddEnterprise from "./pages/enterprises/AddEnterprise";
import TargetEnterprise from "./pages/enterprises/Targetenterprise";
import EditEnterprise from "./pages/enterprises/EditEnterprise";
import EnterpriseDetails from "./pages/enterprises/EnterpriseDetails"

// Positions
import PositionsList from "./pages/positions/PositionsList";
import PositionDetail from "./pages/positions/PositionDetail";
import AddPosition from "./pages/positions/AddPosition";
import EditPosition from "./pages/positions/EditPosition";

// Crawler
import CrawlerList from "./pages/crawler/CrawlerList";
import NewCrawlTask from "./pages/crawler/NewCrawlTask";
import DataCleaning from "./pages/crawler/DataCleaning";

// Permissions
import RolesList from "./pages/permissions/RolesList";
import UsersList from "./pages/permissions/UsersList";
import AddUser from "./pages/permissions/AddUser";
import EditUser from "./pages/permissions/EditUser";
import AddRole from "./pages/permissions/AddRole";
import EditRole from "./pages/permissions/EditRole";

// Statistics
import StatisticsDashboard from "./pages/statistics/StatisticsDashboard";
import SchoolsStatistics from "./pages/statistics/SchoolsStatistics";
import StudentsStatistics from "./pages/statistics/StudentsStatistics";
import UsersStatistics from "./pages/statistics/UsersStatistics";
import PositionsStatistics from "./pages/statistics/PositionsStatistics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard and protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard Layout wrapper */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
            <Route path="dashboard" element={<Dashboard />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            <Route path="profile/change-password" element={<ChangePassword />} />

            {/* Schools */}
            <Route path="schools">
              <Route path="list" element={<SchoolsList />} />
              <Route path="new" element={<AddSchool />} />
              <Route path=":id" element={<SchoolDetail />} />
              <Route path="edit/:id" element={<EditSchool />} />
              <Route index element={<Navigate to="/schools/list" replace />} />
            </Route>
            
            {/* Students */}
            <Route path="students">
              <Route path="list" element={<StudentsList />} />
              <Route path="new" element={<AddStudent />} />
              <Route path=":id" element={<StudentDetail />} />
              <Route index element={<Navigate to="/students/list" replace />} />
            </Route>
            
            {/* Enterprises */}
            <Route path="enterprises">
              <Route path="list" element={<EnterprisesList />} />
              <Route path="new" element={<AddEnterprise />} />
              <Route path="target" element={<TargetEnterprise />} />
              <Route path="edit/:id" element={<EditEnterprise/>} />
               <Route path=":id" element={<EnterpriseDetails/>} />
              <Route index element={<Navigate to="/enterprises/list" replace />} />
            </Route>
            
            {/* Positions */}
            <Route path="positions">
              <Route path="list" element={<PositionsList />} />
              <Route path="new" element={<AddPosition />} />
              <Route path=":id" element={<PositionDetail />} />
              <Route path="edit/:id" element={<EditPosition />} />
              <Route index element={<Navigate to="/positions/list" replace />} />
            </Route>
            
            {/* Crawler */}
            <Route path="crawler">
              <Route path="list" element={<CrawlerList />} />
              <Route path="new" element={<NewCrawlTask />} />
              <Route path="cleaning" element={<DataCleaning />} />
              <Route index element={<Navigate to="/crawler/list" replace />} />
            </Route>
            
            {/* Permissions */}
            <Route path="permissions">
              <Route path="roles" element={<RolesList />} />
              <Route path="roles/new" element={<AddRole />} />
              <Route path="roles/edit/:id" element={<EditRole />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/new" element={<AddUser />} />
              <Route path="users/edit/:id" element={<EditUser />} />
              <Route index element={<Navigate to="/permissions/roles" replace />} />
            </Route>
            
            {/* Statistics */}
            <Route path="statistics">
              <Route index element={<StatisticsDashboard />} />
              <Route path="schools" element={<SchoolsStatistics />} />
              <Route path="students" element={<StudentsStatistics />} />
              <Route path="users" element={<UsersStatistics />} />
              <Route path="positions" element={<PositionsStatistics />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
