
import { Toaster } from "@/components/ui/toaster";
import "./i18n";
import { AuthRoute } from "@/components/auth/AuthRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TabLayout } from "./components/layout/TabLayout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ProfileSetup from "./pages/ProfileSetup";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import InitialPasswordChange from "./pages/InitialPasswordChange";
import JobDetails from "./pages/JobDetails";
import AccountSecurity from "./pages/AccountSecurity";
import MyJobs from "./pages/MyJobs";
import MyResume from "./pages/MyResume";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HelpSupport from "./pages/HelpSupport";
import TermsOfUse from "./pages/TermsOfUse";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import LanguageSettings from "./pages/settings/LanguageSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AuthRoute><TabLayout /></AuthRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/job/:jobId" element={<JobDetails />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile-setup" element={<AuthRoute><ProfileSetup /></AuthRoute>} />
          <Route path="/edit-profile" element={<AuthRoute><EditProfile /></AuthRoute>} />
          <Route path="/change-password" element={<AuthRoute><ChangePassword /></AuthRoute>} />
          <Route path="/initial-password-change" element={<AuthRoute><InitialPasswordChange /></AuthRoute>} />
          <Route path="/account-security" element={<AuthRoute><AccountSecurity /></AuthRoute>} />
          <Route path="/my-jobs" element={<AuthRoute><MyJobs /></AuthRoute>} />
          <Route path="/my-resume" element={<AuthRoute><MyResume /></AuthRoute>} />
          <Route path="/settings" element={<AuthRoute><Settings /></AuthRoute>} />
          <Route path="/settings/language" element={<AuthRoute><LanguageSettings /></AuthRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
