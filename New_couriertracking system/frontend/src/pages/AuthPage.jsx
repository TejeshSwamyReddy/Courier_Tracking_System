import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: ""
};

const tips = [
  "Create bookings with automatic tracking IDs.",
  "Review order history and delivery progress.",
  "Jump from customer view to tracking results in one click."
];

const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode]
  );

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  const updateField = (field) => (event) =>
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "login") {
        const signedInUser = await login({
          email: form.email,
          password: form.password
        });
        navigate(signedInUser.role === "admin" ? "/admin" : "/dashboard");
      } else {
        await register(form);
        navigate("/dashboard");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="shell py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="surface-strong flex flex-col justify-between p-8">
            <div>
              <div className="eyebrow">Customer access</div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight">
                Track deliveries without losing the human feel.
              </h1>
              <p className="mt-4 text-base leading-7" style={{ color: "rgb(var(--muted))" }}>
                Sign in to manage bookings, check recent activity, and keep each shipment close at hand.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {tips.map((tip) => (
                <div key={tip} className="surface flex items-center gap-3 px-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                  Account
                </p>
                <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
              </div>

              <div className="flex rounded-full border border-slate-200 p-1 dark:border-slate-700">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    mode === "login" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    mode === "register" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  Sign up
                </button>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Full name</span>
                  <div className="input-shell">
                    <UserRound className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                    <input
                      className="input-field"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={updateField("name")}
                    />
                  </div>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email address</span>
                <div className="input-shell">
                  <Mail className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <input
                    className="input-field"
                    placeholder="name@example.com"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <div className="input-shell">
                  <LockKeyhole className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <input
                    className="input-field"
                    placeholder="Minimum 8 characters"
                    type="password"
                    value={form.password}
                    onChange={updateField("password")}
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <button className="btn-primary w-full" disabled={busy} type="submit">
                {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p style={{ color: "rgb(var(--muted))" }}>
                Admin team? Use the separate admin access page.
              </p>
              <Link className="font-semibold text-teal-700 dark:text-teal-300" to="/admin/login">
                Open admin login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AuthPage;

