import { LoaderCircle } from "lucide-react";

const LoadingScreen = ({ label = "Loading...", fullscreen = false }) => (
  <div
    className={`flex items-center justify-center ${
      fullscreen ? "min-h-screen" : "min-h-[16rem]"
    }`}
  >
    <div className="surface flex flex-col items-center gap-4 px-8 py-8 text-center animate-fade-rise">
      <LoaderCircle className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-300" />
      <p className="text-sm font-medium" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </p>
    </div>
  </div>
);

export default LoadingScreen;

