import {
  ArrowRight,
  Boxes,
  ChevronRight,
  MapPinned,
  PackageCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const featureCards = [
  {
    title: "Track every move",
    copy: "Give customers a clean tracking journey with clear status updates from booking to doorstep.",
    icon: PackageCheck
  },
  {
    title: "Secure sign-in",
    copy: "JWT-based sessions and hashed passwords keep user and administrator access properly separated.",
    icon: ShieldCheck
  },
  {
    title: "Dispatch with control",
    copy: "Admins can review shipments, update statuses, and manage account access from one dashboard.",
    icon: MapPinned
  }
];

const stats = [
  { label: "Delivery types", value: "3" },
  { label: "Tracking timeline", value: "Live" },
  { label: "Admin visibility", value: "Full" }
];

const HomePage = () => {
  const [trackingId, setTrackingId] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTrack = (event) => {
    event.preventDefault();
    if (!trackingId.trim()) {
      return;
    }

    navigate(`/track/${trackingId.trim().toUpperCase()}`);
  };

  return (
    <Layout>
      <section className="shell py-10 sm:py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="animate-fade-rise">
            <div className="eyebrow">
              <Sparkles className="h-4 w-4" />
              End-to-end courier operations
            </div>
            <h1 className="headline mt-6">
              Book faster, track cleaner, and keep every shipment visible.
            </h1>
            <p className="subcopy mt-6">
              CourierFlow gives customers a polished booking experience and gives operations teams
              the control panel they need to keep deliveries moving.
            </p>

            <form className="surface mt-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-center" onSubmit={handleTrack}>
              <div className="input-shell flex-1">
                <Boxes className="h-5 w-5 text-teal-600 dark:text-teal-300" />
                <input
                  className="input-field"
                  value={trackingId}
                  onChange={(event) => setTrackingId(event.target.value)}
                  placeholder="Enter tracking ID"
                />
              </div>
              <button className="btn-primary" type="submit">
                Track now
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/auth"}>
                {user ? "Open workspace" : "Create account"}
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link className="btn-secondary" to="/admin/login">
                Admin access
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="surface px-5 py-4">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-strong animate-fade-rise overflow-hidden p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                  Dispatch snapshot
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Today&apos;s movement</h2>
              </div>
              <div className="status-pill bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                <span className="h-2 w-2 rounded-full bg-current animate-pulse-soft" />
                Live updates
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl bg-teal-600 p-5 text-white shadow-glow">
                <p className="text-sm uppercase tracking-[0.18em] text-teal-50/80">Priority lane</p>
                <p className="mt-4 text-3xl font-semibold">Express deliveries</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-teal-50/90">
                  Same dashboard, different service levels. Quote, book, and trace each package from one flow.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="surface p-5">
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Sample route
                  </p>
                  <p className="mt-3 text-xl font-semibold">Chennai to Bengaluru</p>
                  <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                    Tracking ID CTS-AB12CD-EF34GH moving through pickup, transit, and delivery confirmation.
                  </p>
                </div>
                <div className="surface p-5">
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Customer promise
                  </p>
                  <p className="mt-3 text-xl font-semibold">Responsive on any screen</p>
                  <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                    Quick tracking from the homepage, a clean booking form, and a usable admin control room on mobile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-8 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {featureCards.map(({ title, copy, icon: Icon }) => (
            <div key={title} className="surface p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
