import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import DemoPage from './pages/DemoPage'
import BreadboardDemo from './pages/BreadboardDemo'
import ResistorDemo from './pages/ResistorDemo'
import CapacitorDemo from './pages/CapacitorDemo'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/breadboard-demo" element={<BreadboardDemo />} />
      <Route path="/resistor-demo" element={<ResistorDemo />} />
      <Route path="/capacitor-demo" element={<CapacitorDemo />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:schematicId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
