import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Banner from './components/Banner';
import Footer from './components/Footer';
import './styles/App.css';

// Lazy load page components for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const UploadCV = lazy(() => import('./pages/UploadCV'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Projects = lazy(() => import('./pages/Projects'));

// Loading fallback component
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px',
    fontSize: '1.2rem',
    color: '#0073b1'
  }}>
    Loading...
  </div>
);

const App = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Admin Routes - No Header/Footer */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Public Routes - With Header/Footer */}
            <Route path="/*" element={
              <>
                <Header />
                <Navigation />
                <Banner />
                <main className="main-content">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/recruitment" element={<RecruitmentPage />} />
                      <Route path="/upload-cv" element={<UploadCV />} />
                      <Route path="/projects" element={<Projects />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;