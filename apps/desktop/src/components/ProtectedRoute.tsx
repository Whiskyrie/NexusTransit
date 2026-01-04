import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticated } from "../stores/auth.store";

/**
 * Componente de proteção de rotas
 *
 * Redireciona para login se usuário não autenticado
 * Renderiza rotas filhas se autenticado
 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    // Redireciona para login preservando URL original
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
