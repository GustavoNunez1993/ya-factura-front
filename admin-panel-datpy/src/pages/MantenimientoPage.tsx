import { useNavigate } from "react-router-dom";
import logoYaFactura from "../imagenes/logo.png";
import "./MantenimientoPage.css";

export default function MantenimientoPage() {
  const navigate = useNavigate();

  return (
    <div className="maintenance-page">
      <header className="maintenance-header">
        <div className="brand" aria-label="YaFactura logo">
          <img src={logoYaFactura} alt="YaFactura" className="brand-logo" />
        </div>
      </header>

      <main className="maintenance-main">
        <div className="maintenance-card">
          <section className="maintenance-copy">
            <div className="section-tag">
              <span className="tag-dot" />
              SECCIÓN EN MANTENIMIENTO
            </div>

            <h1>
              Estamos trabajando
              <br />
              en esta sección.
            </h1>

            <p>
              Este módulo de YaFactura no está disponible temporalmente. Puede seguir usando las
              demás funciones y volver a intentarlo más tarde.
            </p>

            <button type="button" onClick={() => navigate("/dashboard")}>
              Ir al panel <span aria-hidden="true">→</span>
            </button>
          </section>

          <div className="maintenance-visual" aria-hidden="true">
            <div className="visual-shape shape-one" />
            <div className="visual-shape shape-two" />
            <div className="visual-shape shape-three" />

            <svg viewBox="0 0 440 280" className="maintenance-illustration">
              <rect x="58" y="52" width="218" height="150" rx="18" fill="#f3f7ff" />
              <rect x="80" y="30" width="188" height="150" rx="18" fill="#ffffff" />
              <rect x="92" y="44" width="60" height="8" rx="4" fill="#dfe7ff" />
              <rect x="92" y="60" width="120" height="8" rx="4" fill="#edf2ff" />
              <rect x="92" y="78" width="110" height="8" rx="4" fill="#dfe7ff" />
              <rect x="92" y="96" width="76" height="8" rx="4" fill="#edf2ff" />
              <rect x="92" y="124" width="78" height="52" rx="12" fill="#2e6ce8" />
              <rect x="178" y="124" width="62" height="52" rx="12" fill="#5299ff" opacity="0.5" />
              <rect x="180" y="124" width="18" height="52" rx="9" fill="#dbeafe" />
              <circle cx="246" cy="104" r="16" fill="#cfe5ff" />
              <rect x="248" y="84" width="30" height="14" rx="7" fill="#dfe7ff" />
              <rect x="248" y="102" width="30" height="14" rx="7" fill="#cfe5ff" />
              <rect x="228" y="152" width="58" height="16" rx="8" fill="#dfe7ff" />
              <rect x="286" y="94" width="92" height="86" rx="20" fill="#2e6ce8" />
              <circle cx="332" cy="140" r="26" fill="#fefefe" />
              <path d="M323 134v12h18v-12M332 104v18M308 140h48" stroke="#2e6ce8" strokeWidth="8" strokeLinecap="round" />
              <path d="M311 157v18h42v-18" stroke="#2e6ce8" strokeWidth="8" strokeLinecap="round" />
              <path d="M294 186h44" stroke="#dbeafe" strokeWidth="10" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </main>

      <footer className="maintenance-footer">YaFactura - una solución de datPy</footer>
    </div>
  );
}
