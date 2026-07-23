import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AssessmentPage } from "./pages/AssessmentPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ListingPage } from "./pages/ListingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VitalsPage } from "./pages/VitalsPage";

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected clinical routes — require Bearer token */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vitals/:patientId" element={<VitalsPage />} />
          <Route path="/assessment/general" element={<AssessmentPage kind="general" />} />
          <Route
            path="/assessment/overweight"
            element={<AssessmentPage kind="overweight" />}
          />
          <Route path="/listing" element={<ListingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
