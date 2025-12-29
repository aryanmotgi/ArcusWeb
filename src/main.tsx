
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { RepresenterAuthProvider } from "./contexts/RepresenterAuthContext";

  createRoot(document.getElementById("root")!).render(
    <RepresenterAuthProvider>
      <App />
    </RepresenterAuthProvider>
  );
  