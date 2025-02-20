import React, { useState } from 'react';
import { ArrowRight, Workflow } from 'lucide-react';
import WelcomePage from './components/WelcomePage.tsx';
import LoginModal from './components/LoginModal.tsx';
import WorkflowWizard from './components/WorkflowWizard.tsx';
import Dashboard from './components/Dashboard.tsx';
import ApiService from './services/api';


type Page = 'welcome' | 'wizard' | 'dashboard';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const handleLogin = async (userType: 'user' | 'role', role?: string) => {
    setIsAuthenticated(true);
    setIsLoginOpen(false);
    if (userType === 'role' && role === 'designer') {
      setCurrentPage('wizard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout =  async() => {
    await ApiService.logout();
    setIsAuthenticated(false);
    setCurrentPage('welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)} 
          onLogin={handleLogin}
        />
      )}
      
      {currentPage === 'welcome' && (
        <WelcomePage onGetStarted={() => setIsLoginOpen(true)} />
      )}
      
      {currentPage === 'wizard' && (
        <WorkflowWizard onComplete={() => setCurrentPage('dashboard')} />
      )}
      
      {currentPage === 'dashboard' && (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;