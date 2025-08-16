import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { getCurrentUser } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(({ data }) => {
        if (data) navigate('/dashboard');
      })
      .catch(() => {});
  }, [navigate]);

  return (
    <div>
      <GoogleLoginButton />
    </div>
  );
}
