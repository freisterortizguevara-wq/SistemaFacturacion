import { useState } from "react";
import { Icon } from "./components/Icon";
import Clientes from "./pages/Clientes";
import Facturas from "./pages/Facturas";
import Productos from "./pages/Productos";
import Reportes from "./pages/Reportes";

export default function App() {
  const [vista, setVista] = useState<"clientes" | "facturas" | "productos" | "reportes">("clientes");

  const menuItems = [
    { id: "clientes", label: "Clientes", icon: "users" as const },
    { id: "facturas", label: "Facturas", icon: "file" as const },
    { id: "productos", label: "Productos", icon: "box" as const },
    { id: "reportes", label: "Reportes", icon: "chart" as const },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        {/* BRAND / LOGO PREMIUM */}
        <div className="brand">
          <div className="logo" style={{ 
            background: "linear-gradient(135deg, #5b5cf0 0%, #8b80ff 100%)", 
            boxShadow: "0 8px 20px rgba(91, 92, 240, 0.4)",
            position: "relative"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <strong style={{ fontSize: "15px", letterSpacing: "-0.3px" }}>Facturación FLOG</strong>
            <small style={{ fontSize: "11px", color: "#929bb9", marginTop: "2px" }}>Panel administrativo</small>
          </div>
        </div>

        <div style={{ padding: "0 12px 12px", fontSize: "10px", fontWeight: "700", color: "#6c769b", textTransform: "uppercase", letterSpacing: "1px" }}>
          Módulos
        </div>

        {/* NAVEGACIÓN PREMIUM */}
        <nav>
          {menuItems.map((item) => (
            <button 
              key={item.id}
              className={`nav-item ${vista === item.id ? "active" : ""}`} 
              onClick={() => setVista(item.id as any)}
            >
              <Icon name={item.icon} /> 
              <span style={{ fontWeight: vista === item.id ? 600 : 500 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* FOOTER / USUARIO */}
        <div className="sidebar-foot">
          <div className="avatar small" style={{ background: "linear-gradient(135deg, #5b5cf0, #8b80ff)" }}>FO</div>
          <div>
            <strong style={{ fontSize: "13px" }}>Freister Ortiz</strong>
            <small style={{ fontSize: "11px", color: "#929bb9" }}>Ingeniero - Admin</small>
          </div>
        </div>
      </aside>

      <div className="content">
        {/* AÑADIMOS UNA ANIMACIÓN AL CAMBIAR DE PÁGINA */}
        <div key={vista} className="page-transition">
          {vista === "clientes" && <Clientes />}
          {vista === "facturas" && <Facturas />}
          {vista === "productos" && <Productos />}
          {vista === "reportes" && <Reportes />}
        </div>
      </div>
    </div>
  );
}