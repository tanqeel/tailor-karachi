import { Navigate } from 'react-router-dom';
import AuthGate from '@/components/AuthGate';

export default function Login() {
  return (
    <AuthGate>
      <Navigate to="/" replace />
    </AuthGate>
  );
}
