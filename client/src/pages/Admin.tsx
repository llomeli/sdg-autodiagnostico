import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, LockKeyhole, LogIn } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { DashboardView } from "./admin/DashboardView";
import { ProspectsView } from "./admin/ProspectsView";

type Tab = "prospects" | "dashboard";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const selfHosted = import.meta.env.VITE_SELF_HOSTED_MODE === "true";
  const utils = trpc.useUtils();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [tab, setTab] = useState<Tab>("prospects");
  const localLogin = trpc.auth.localLogin.useMutation({
    onSuccess: data => utils.auth.me.setData(undefined, data),
  });

  if (loading) return <div className="admin-loading">Cargando acceso…</div>;

  if (!isAuthenticated) {
    return (
      <main className="admin-gate">
        <button
          className="back-home admin-back"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft size={16} /> Volver al diagnóstico
        </button>
        <div className="gate-card">
          <div className="gate-icon">
            <LockKeyhole size={28} />
          </div>
          <p className="eyebrow">ACCESO INTERNO</p>
          <h1>
            Gestión de
            <br />
            <em>prospectos.</em>
          </h1>
          <p>
            {selfHosted
              ? "Ingresa con las credenciales configuradas en el servidor para consultar los registros y darles seguimiento."
              : "Inicia sesión para consultar los registros, respuestas y prioridades capturadas en el autodiagnóstico."}
          </p>
          {selfHosted ? (
            <form
              className="local-login-form"
              onSubmit={event => {
                event.preventDefault();
                localLogin.mutate(credentials);
              }}
            >
              <label>
                Usuario
                <input
                  value={credentials.username}
                  onChange={event =>
                    setCredentials(prev => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                  autoComplete="username"
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  value={credentials.password}
                  onChange={event =>
                    setCredentials(prev => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  autoComplete="current-password"
                />
              </label>
              {localLogin.error && (
                <p className="admin-error">{localLogin.error.message}</p>
              )}
              <button
                className="button button-aqua"
                type="submit"
                disabled={localLogin.isPending}
              >
                {localLogin.isPending ? "Validando…" : "Iniciar sesión"}{" "}
                <LogIn size={17} />
              </button>
            </form>
          ) : (
            <button className="button button-aqua" onClick={() => startLogin()}>
              Iniciar sesión <LogIn size={17} />
            </button>
          )}
        </div>
      </main>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="admin-gate">
        <button
          className="back-home admin-back"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft size={16} /> Volver al diagnóstico
        </button>
        <div className="gate-card">
          <div className="gate-icon">
            <LockKeyhole size={28} />
          </div>
          <p className="eyebrow">ACCESO RESTRINGIDO</p>
          <h1>
            Permiso
            <br />
            <em>requerido.</em>
          </h1>
          <p>
            Esta sección está reservada para administradores autorizados del
            proyecto.
          </p>
          <button className="button button-outline" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button className="brand-admin" onClick={() => setLocation("/")}>
          <img src="/sdg-logo.png" alt="SDG Group" />
          <b>autodiagnóstico</b>
        </button>
        <div>
          <span>{user.name || user.email}</span>
          <button onClick={() => logout()}>Cerrar sesión</button>
        </div>
      </header>
      <section className="admin-main">
        <div className="admin-intro">
          <div>
            <p className="eyebrow">CAPTURA Y SEGUIMIENTO</p>
            <h1>
              Prospectos de
              <br />
              <em>gobierno de datos.</em>
            </h1>
          </div>
          <nav className="admin-tabs" role="tablist" aria-label="Secciones">
            <button
              role="tab"
              aria-selected={tab === "prospects"}
              className={tab === "prospects" ? "active" : ""}
              onClick={() => setTab("prospects")}
            >
              Prospectos
            </button>
            <button
              role="tab"
              aria-selected={tab === "dashboard"}
              className={tab === "dashboard" ? "active" : ""}
              onClick={() => setTab("dashboard")}
            >
              Tablero
            </button>
          </nav>
        </div>
        {tab === "prospects" ? <ProspectsView /> : <DashboardView />}
      </section>
    </main>
  );
}
