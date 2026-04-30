import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Moon,
  PackageSearch,
  ShieldCheck,
  SunMedium,
  UserCircle2
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NavBar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-teal-600 text-white shadow-glow"
        : "text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800/80"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:bg-slate-950/60">
      <div className="shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-glow">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">CourierFlow</div>
              <div className="text-xs uppercase tracking-[0.22em]" style={{ color: "rgb(var(--muted))" }}>
                Smart Dispatch Network
              </div>
            </div>
          </Link>

          <nav className="hidden flex-wrap items-center gap-2 lg:flex">
            <NavLink className={linkClass} to="/">
              Home
            </NavLink>
            <NavLink className={linkClass} to="/track">
              Track
            </NavLink>
            {user?.role === "admin" ? (
              <NavLink className={linkClass} to="/admin">
                Admin
              </NavLink>
            ) : null}
            {user?.role === "user" ? (
              <NavLink className={linkClass} to="/dashboard">
                Dashboard
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary px-3 py-3" onClick={toggleTheme} type="button">
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              <div className="surface hidden items-center gap-3 px-4 py-2 md:flex">
                <UserCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-300" />
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    {user.role}
                  </p>
                </div>
              </div>
              <Link
                className="btn-secondary"
                to={user.role === "admin" ? "/admin" : "/dashboard"}
              >
                {user.role === "admin" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                Console
              </Link>
              <button className="btn-secondary" onClick={handleLogout} type="button">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" to="/track">
                <PackageSearch className="h-4 w-4" />
                Track shipment
              </Link>
              <Link className="btn-primary" to="/auth">
                <UserCircle2 className="h-4 w-4" />
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;

