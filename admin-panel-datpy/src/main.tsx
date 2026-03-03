import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";

function Root() {
  const [mode, setMode] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    localStorage.setItem("theme", newMode);
    setMode(newMode);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode }
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App toggleTheme={toggleTheme} />
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);