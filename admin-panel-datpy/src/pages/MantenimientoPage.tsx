import { useNavigate } from "react-router-dom";

export default function MantenimientoPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
        padding: "24px",
        background: "linear-gradient(180deg, #f3f7ff 0%, #ebf1ff 100%)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(15, 23, 42, 0.12)",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          background: "#ffffff"
        }}
      >
        <div style={{ padding: "48px 48px 48px 64px" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              margin: 0,
              color: "#102a43"
            }}
          >
            404
          </div>
          <p
            style={{
              margin: "12px 0 24px",
              color: "#2563eb",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: 14
            }}
          >
            Módulo en mantenimiento
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.1,
              color: "#0f2747"
            }}
          >
            Esta sección no está disponible por ahora.
          </h1>
          <p style={{ margin: "24px 0", color: "#475569", maxWidth: 520, fontSize: 16 }}>
            El módulo que intentas abrir está en mantenimiento o aún no fue implementado.
            Regresa al Dashboard y revisa los módulos disponibles.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "14px 28px",
              background: "#4f46e5",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 14px 30px rgba(79, 70, 229, 0.18)"
            }}
          >
            Volver al Dashboard
          </button>
        </div>

        <div
          style={{
            background: "linear-gradient(180deg, #eef2ff 0%, #ffffff 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "48px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              position: "relative"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -20,
                width: 90,
                height: 90,
                borderRadius: 22,
                background: "#dbeafe",
                boxShadow: "0 20px 40px rgba(99, 102, 241, 0.12)"
              }}
            />
            <svg
              viewBox="0 0 560 420"
              fill="none"
              style={{ width: "100%", height: "auto", position: "relative", zIndex: 1 }}
            >
              <rect x="50" y="140" width="460" height="200" rx="28" fill="#e0e7ff" />
              <rect x="88" y="80" width="384" height="220" rx="24" fill="#ffffff" />
              <rect x="144" y="128" width="220" height="18" rx="9" fill="#c7d2fe" />
              <rect x="144" y="162" width="320" height="18" rx="9" fill="#e0e7ff" />
              <rect x="144" y="196" width="180" height="18" rx="9" fill="#c7d2fe" />
              <rect x="144" y="230" width="280" height="18" rx="9" fill="#e0e7ff" />
              <path d="M144 282h260" stroke="#c7d2fe" strokeWidth="16" strokeLinecap="round" />
              <rect x="32" y="310" width="496" height="20" rx="10" fill="#dbeafe" />
              <path d="M320 80l20-40h40l20 40" fill="#4338ca" />
              <circle cx="360" cy="44" r="10" fill="#fff" />
              <rect x="330" y="60" width="60" height="12" rx="6" fill="#4338ca" />
              <rect x="118" y="240" width="80" height="110" rx="20" fill="#4338ca" />
              <rect x="352" y="240" width="80" height="110" rx="20" fill="#4f46e5" />
              <path d="M180 220c0-28 40-28 40 0v30h-40v-30Z" fill="#818cf8" />
              <path d="M260 202c0-24 28-24 28 0v28h-28v-28Z" fill="#6366f1" />
              <rect x="200" y="136" width="40" height="72" rx="20" fill="#4338ca" />
              <rect x="322" y="132" width="40" height="74" rx="20" fill="#4338ca" />
              <path d="M190 144h180" stroke="#c7d2fe" strokeWidth="12" strokeLinecap="round" />
              <path d="M220 180h120" stroke="#c7d2fe" strokeWidth="12" strokeLinecap="round" />
              <circle cx="290" cy="190" r="18" fill="#4338ca" />
              <text x="280" y="142" fill="#ffffff" fontSize="42" fontWeight="800">?</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
