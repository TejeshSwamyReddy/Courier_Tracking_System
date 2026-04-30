import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { user, loginAdmin } = useAuth();
  const navigate = useNavigate();

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await loginAdmin({ email, password });
      navigate("/admin");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="shell py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-strong p-8">
            <div className="eyebrow">
              <ShieldCheck className="h-4 w-4" />
              Operations control
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Admin access for dispatch visibility and user management.
            </h1>
            <p className="mt-5 text-base leading-7" style={{ color: "rgb(var(--muted))" }}>
              The admin panel is separated from customer login so shipment updates and account changes stay in the right hands.
            </p>
          </div>

          <div className="surface p-8">
            <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
              Administrator sign-in
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Open the control panel</h2>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email address</span>
                <div className="input-shell">
                  <Mail className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <input
                    className="input-field"
                    placeholder="admin@courierflow.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <div className="input-shell">
                  <LockKeyhole className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <input
                    className="input-field"
                    placeholder="Enter admin password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <button className="btn-primary w-full" disabled={busy} type="submit">
                {busy ? "Signing in..." : "Enter admin panel"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminLoginPage;

