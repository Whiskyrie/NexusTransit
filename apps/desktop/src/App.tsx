import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { DriversPage } from "./pages/DriversPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { RoutesPage } from "./pages/RoutesPage";
import { DeliveriesPage } from "./pages/DeliveriesPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layouts";
import { useIsAuthenticated } from "./stores/auth.store";
import "./App.css";

/**
 * Componente principal da aplicação
 * Gerencia roteamento e autenticação
 */
function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Routes>
      {/* Rota pública: Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Rotas protegidas com Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          {/* Adicione mais rotas protegidas aqui */}
        </Route>
      </Route>

      {/* Redirect padrão */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
