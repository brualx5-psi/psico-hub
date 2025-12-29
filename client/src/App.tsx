import React from 'react';
import { PatientProvider, usePatients } from './context/PatientContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './components/HomePage';
import { ClinicalWorkspace } from './components/ClinicalWorkspace';
import { LoginPage } from './components/LoginPage';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentPatient, isLoading } = usePatients();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show loading while loading patient data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentPatient) {
    return <ClinicalWorkspace />;
  }

  return <HomePage />;
};

function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <AppContent />
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;
