import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Banner from './components/Banner';
import ThemeToggle from './components/ThemeToggle';
import RequireAuth from './components/RequireAuth';
import './i18n/config';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const TradingSignals = lazy(() => import('./pages/TradingSignals'));
const EconomicCalendar = lazy(() => import('./pages/EconomicCalendar'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const AnalysisView = lazy(() => import('./pages/AnalysisView'));
const PostView = lazy(() => import('./pages/PostView'));
const LiveStream = lazy(() => import('./pages/LiveStream'));
const LiveStreamView = lazy(() => import('./pages/LiveStreamView'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  // Set document direction based on language
  React.useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Router>
      <div className={`min-h-screen bg-trading-pattern dark:bg-gray-900 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="bg-trading-gradient dark:bg-gray-900/50">
          <Navbar />
          <main className="container mx-auto px-4 py-8 pb-20 md:pb-8 bg-financial-pattern dark:bg-gray-900/30">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Protected routes */}
                <Route path="/profile" element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                } />
                <Route path="/trading-signals" element={<TradingSignals />} />
                <Route path="/market-analysis" element={<MarketAnalysis />} />
                <Route path="/market-analysis/:id" element={<AnalysisView />} />
                <Route path="/post/:id" element={<PostView />} />
                <Route path="/economic-calendar" element={<EconomicCalendar />} />
                <Route path="/live" element={<LiveStream />} />
                <Route path="/live/:id" element={<LiveStreamView />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                {/* Admin routes */}
                <Route path="/admin" element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                } />

                {/* Catch all route - redirect to home */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <MobileNav />
          <Banner />
          <ThemeToggle />
        </div>
      </div>
    </Router>
  );
}

export default App;