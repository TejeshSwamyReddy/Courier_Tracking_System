import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "courierflow-auth";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, token: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedAuth = localStorage.getItem(STORAGE_KEY);

      if (!savedAuth) {
        setLoading(false);
        return;
      }

      try {
        const parsedAuth = JSON.parse(savedAuth);
        const response = await api.me(parsedAuth.token);
        setAuth({ token: parsedAuth.token, user: response.user });
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const persistAuth = (payload) => {
    const nextAuth = { token: payload.token, user: payload.user };
    setAuth(nextAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    return payload.user;
  };

  const register = async (payload) => persistAuth(await api.register(payload));
  const login = async (payload) => persistAuth(await api.login(payload));
  const loginAdmin = async (payload) => persistAuth(await api.adminLogin(payload));

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        loading,
        register,
        login,
        loginAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};

