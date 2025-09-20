import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setChecking(true);
      try {
        const API_ROOT = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
        const res = await axios.get(`${API_ROOT}/auth/me/`);
        if (!mounted) return;
        // If the endpoint returned a user object, consider authenticated
        setAuthed(Boolean(res?.data && (res.data.id || res.data.username)));
      } catch (err) {
        if (!mounted) return;
        setAuthed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/auth" state={{ next: location.pathname }} replace />;
  }

  return children;
}
