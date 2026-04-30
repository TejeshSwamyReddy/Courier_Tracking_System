import NavBar from "./NavBar";

const Layout = ({ children }) => (
  <div className="min-h-screen">
    <NavBar />
    <main>{children}</main>
    <footer className="shell py-10">
      <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-6 text-sm dark:border-slate-800/70 md:flex-row md:items-center md:justify-between">
        <p style={{ color: "rgb(var(--muted))" }}>
          CourierFlow keeps booking, tracking, and dispatch updates in one place.
        </p>
        <p style={{ color: "rgb(var(--muted))" }}>Built with React, Express, and MongoDB.</p>
      </div>
    </footer>
  </div>
);

export default Layout;

