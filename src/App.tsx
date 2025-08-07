import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';

export default function App() {
  return (
    <AuthProvider>
      <div className="dark min-h-screen">
        <AuthGuard />
      </div>
    </AuthProvider>
  );
}