import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { ToastProvider } from './components/ui/alert/ToastContext';
import { CurrentUserProvider } from './context/CurrentUserContext';

const App: React.FC = () => {
  return (
    <Router>
      <CurrentUserProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </CurrentUserProvider>
    </Router>
  );
};

export default App;