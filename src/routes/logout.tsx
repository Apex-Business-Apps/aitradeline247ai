import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Logout: React.FC = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return <Navigate to="/" replace />;
};

export default Logout;