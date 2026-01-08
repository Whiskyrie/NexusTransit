import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "../stores/auth.store";
import { authService } from "../services/auth.service";
import type { LoginCredentials } from "../types/auth.types";
import { AuthCard } from "../components/ui/AuthCard";
import { TabSwitcher } from "../components/ui/TabSwitcher";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

/**
 * Schema de validação Zod para login
 */
const loginSchema = z.object({
  email: z.string().min(1, "Email address is required").email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type TabType = "login" | "signup";

/**
 * Componente de Login/Signup
 *
 * Implementa design system conforme login-design.json
 */
export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [activeTab, setActiveTab] = useState<TabType>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // Limpa shake animation após 400ms
  useEffect(() => {
    if (shakeError) {
      const timer = setTimeout(() => setShakeError(false), 400);
      return () => clearTimeout(timer);
    }
  }, [shakeError]);

  /**
   * Handler de submit do formulário
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setLoading(true);
      setErrorMessage(null);

      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
      };

      const authResponse = await authService.login(credentials);
      setAuth(authResponse);

      // Redireciona para dashboard
      navigate("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid credentials. Please try again.";
      setErrorMessage(message);
      setShakeError(true);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const tabOptions = [
    { id: "login", label: "Log In", icon: <LogIn size={16} /> },
    { id: "signup", label: "Sign Up", icon: <UserPlus size={16} /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E5E7EB 1px, transparent 1px),
            linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className={shakeError ? "animate-shake" : ""}>
        <AuthCard>
          <TabSwitcher
            options={tabOptions}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabType)}
            className="mb-8"
          />

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="your@email.com"
                icon={<Mail size={18} />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    className="text-[13px] font-medium text-gray-900 hover:underline absolute right-0 -top-8"
                    aria-label="Reset your password"
                  >
                    Forgot password?
                  </button>
                }
                {...register("password")}
              />

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-500 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                aria-label="Log in to your account"
              >
                Log In
              </Button>
            </form>
          )}

          {/* Sign Up Form (Placeholder) */}
          {activeTab === "signup" && (
            <div className="text-center py-12 text-gray-500">
              <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Sign up form coming soon...</p>
            </div>
          )}

          {/* Footer */}
          {activeTab === "login" && (
            <div className="text-center mt-8">
              <span className="text-sm text-gray-500">Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className="text-sm font-semibold text-gray-900 underline hover:text-black cursor-pointer bg-transparent border-none p-0"
                aria-label="Create a new account"
              >
                Sign up
              </button>
            </div>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
