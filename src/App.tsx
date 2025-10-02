import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ExercisesList } from './pages/ExercisesList';
import { ExerciseForm } from './pages/ExerciseForm';
import { SessionsList } from './pages/SessionsList';
import { SessionForm } from './pages/SessionForm';
import { ProgramsList } from './pages/ProgramsList';
import { ProgramForm } from './pages/ProgramForm';
import TabataTimer from './pages/TabataTimer';
import Timer from './pages/Timer';
import SessionPlay from './pages/SessionPlay';

function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/exercises" element={<ExercisesList />} />
                    <Route path="/exercises/new" element={<ExerciseForm />} />
                    <Route path="/exercises/:id" element={<ExerciseForm />} />
                    <Route path="/exercises/:id/edit" element={<ExerciseForm />} />
                    <Route path="/sessions" element={<SessionsList />} />
                    <Route path="/sessions/new" element={<SessionForm />} />
                    <Route path="/sessions/:id" element={<SessionForm />} />
                    <Route path="/sessions/:id/edit" element={<SessionForm />} />
                    <Route path="/sessions/:id/play" element={<SessionPlay />} />
                    <Route path="/programs" element={<ProgramsList />} />
                    <Route path="/programs/new" element={<ProgramForm />} />
                    <Route path="/programs/:id" element={<ProgramForm />} />
                    <Route path="/programs/:id/edit" element={<ProgramForm />} />
                    <Route path="/timer/tabata" element={<TabataTimer />} />
                    <Route path="/timer" element={<Timer />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;
