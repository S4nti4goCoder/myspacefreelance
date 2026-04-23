import { usePageTitle } from "@/hooks/usePageTitle";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  LogIn,
  Briefcase,
  Eye,
  EyeOff,
  FolderKanban,
  FileText,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { isValidEmail, normalizeEmail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MIN_PASSWORD_LENGTH = 6;

const features = [
  {
    icon: FolderKanban,
    title: "Gestión de proyectos",
    description: "Organiza tareas, plazos y clientes en un mismo lugar",
  },
  {
    icon: FileText,
    title: "Cotizaciones profesionales",
    description: "Genera y envía presupuestos listos para firmar",
  },
  {
    icon: CreditCard,
    title: "Seguimiento de pagos",
    description: "Controla ingresos, saldos pendientes y facturación",
  },
  {
    icon: BarChart3,
    title: "Reportes y analíticas",
    description: "Visualiza el estado de tu actividad freelance",
  },
];

export default function LoginPage() {
  usePageTitle("Iniciar sesión");
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    if (profile?.role === "client")
      return <Navigate to="/cliente/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("El correo electrónico no tiene un formato válido");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      useAuthStore.getState().setUser(data.user);
      useAuthStore.getState().setProfile(profileData);
      useAuthStore.getState().setIsLoading(false);

      toast.success("¡Bienvenido de vuelta!");

      if (profileData?.role === "client") {
        navigate("/cliente/dashboard");
      } else {
        navigate("/");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Left panel — branding */}
      <div className="hidden md:flex relative overflow-hidden bg-linear-to-br from-primary/20 via-primary/5 to-background p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary),transparent_60%)]/15" />

        <div className="relative w-full max-w-md mx-auto flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              MySpaceFreelance
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 py-10"
          >
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                Tu espacio de trabajo
                <br />
                freelance en un solo lugar
              </h2>
              <p className="text-muted-foreground text-base">
                Administra tus proyectos, clientes y cobros desde un panel
                pensado para quienes trabajan por cuenta propia.
              </p>
            </div>

            <ul className="space-y-4">
              {features.map((f, i) => (
                <motion.li
                  key={f.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {f.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} MySpaceFreelance
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8 gap-2 md:hidden">
            <div className="bg-primary rounded-xl p-3">
              <Briefcase className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              MySpaceFreelance
            </h1>
            <p className="text-muted-foreground text-sm">
              Tu espacio de trabajo personal
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Iniciar sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={isLoading}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Ingresar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground mt-6 space-x-1">
            <Link to="/terminos" className="hover:underline">
              Terminos y Condiciones
            </Link>
            <span>·</span>
            <Link to="/privacidad" className="hover:underline">
              Politica de Privacidad
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
