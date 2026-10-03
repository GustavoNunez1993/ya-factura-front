import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useTenant } from "../context/TenantContext";
import { useUser } from "../context/UserContext";
import { formatCurrency } from "../utils/currency";

const mockOrders = [
  {
    id: "UT-10482",
    date: "15 jul 2026",
    items: "Remera Básica de Algodón, Jean Slim Fit",
    total: 414000,
    status: "Entregado",
  },
  {
    id: "UT-10357",
    date: "02 jul 2026",
    items: "Campera Inflable Acolchada",
    total: 495000,
    status: "Entregado",
  },
  {
    id: "UT-10201",
    date: "18 jun 2026",
    items: "Zapatillas Urbanas Blancas, Gorra con Visera Curva",
    total: 474000,
    status: "Cancelado",
  },
];

const mockAddresses = [
  {
    label: "Casa",
    detail: "5ta Avenida 12-34, Zona 10, Ciudad de Guatemala",
    isDefault: true,
  },
  {
    label: "Oficina",
    detail: "Torre Empresarial, Nivel 8, Zona 4, Ciudad de Guatemala",
    isDefault: false,
  },
];

const mockReturns = [
  {
    item: "Vestido Negro Elegante",
    reason: "Cambio de talle",
    date: "10 jul 2026",
    status: "En proceso",
  },
  {
    item: "Botas de Cuero",
    reason: "Producto con defecto",
    date: "22 may 2026",
    status: "Aprobado",
  },
];

const mockPaymentMethods = [
  { brand: "Visa", last4: "4242", expires: "08/28" },
  { brand: "Mastercard", last4: "8890", expires: "02/27" },
];

const mockNotifications = [
  { label: "Ofertas y promociones", enabled: true },
  { label: "Novedades de la colección", enabled: true },
  { label: "Actualizaciones de pedidos", enabled: false },
];

const mockFaqs = [
  { question: "¿Cuánto tarda el envío?", answer: "Entre 45 y 60 minutos en Ciudad de Guatemala." },
  { question: "¿Cómo hago un cambio o devolución?", answer: "Desde 'Mis Cambios y Devoluciones' puedes iniciar la solicitud." },
  { question: "¿Cuál es el teléfono de soporte?", answer: "+502 2345-6789, lunes a domingo de 7am a 9pm." },
];

function OrdersPanel() {
  return (
    <div className="divide-y divide-outline-variant/30">
      {mockOrders.map((order) => (
        <div key={order.id} className="py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-label-md text-label-md text-primary">
              #{order.id} · {order.date}
            </p>
            <p className="text-body-sm text-on-surface-variant">{order.items}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                order.status === "Entregado"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressesPanel() {
  return (
    <div className="divide-y divide-outline-variant/30">
      {mockAddresses.map((address) => (
        <div key={address.label} className="py-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-label-md text-label-md text-primary">{address.label}</p>
            <p className="text-body-sm text-on-surface-variant">{address.detail}</p>
          </div>
          {address.isDefault && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container whitespace-nowrap">
              Predeterminada
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ReturnsPanel() {
  return (
    <div className="divide-y divide-outline-variant/30">
      {mockReturns.map((returnItem) => (
        <div
          key={returnItem.item}
          className="py-3 flex items-center justify-between gap-3"
        >
          <div>
            <p className="font-label-md text-label-md text-primary">
              {returnItem.item}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {returnItem.reason} · {returnItem.date}
            </p>
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
              returnItem.status === "Aprobado"
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-error-container text-on-error-container"
            }`}
          >
            {returnItem.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function PaymentMethodsPanel() {
  return (
    <div className="divide-y divide-outline-variant/30">
      {mockPaymentMethods.map((method) => (
        <div key={method.last4} className="py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">credit_card</span>
          <div className="flex-1">
            <p className="font-label-md text-label-md text-primary">
              {method.brand} •••• {method.last4}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Vence {method.expires}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState(mockNotifications);

  function toggle(label: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.label === label ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  return (
    <div className="divide-y divide-outline-variant/30">
      {notifications.map((item) => (
        <div key={item.label} className="py-3 flex items-center justify-between gap-3">
          <span className="text-body-md">{item.label}</span>
          <button
            onClick={() => toggle(item.label)}
            aria-label={`Alternar ${item.label}`}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              item.enabled ? "bg-primary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                item.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="divide-y divide-outline-variant/30">
      {mockFaqs.map((faq) => (
        <div key={faq.question} className="py-3">
          <p className="font-label-md text-label-md text-primary">{faq.question}</p>
          <p className="text-body-sm text-on-surface-variant">{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}

const menuItems = [
  { id: "pedidos", icon: "receipt_long", label: "Mis Pedidos", panel: OrdersPanel },
  { id: "direcciones", icon: "location_on", label: "Direcciones de Envío", panel: AddressesPanel },
  { id: "cambios", icon: "assignment_return", label: "Mis Cambios y Devoluciones", panel: ReturnsPanel },
  { id: "pagos", icon: "credit_card", label: "Métodos de Pago", panel: PaymentMethodsPanel },
  { id: "notificaciones", icon: "notifications", label: "Notificaciones", panel: NotificationsPanel },
  { id: "ayuda", icon: "help", label: "Ayuda y Soporte", panel: HelpPanel },
];

export default function Profile() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { user } = useUser();
  const [openItem, setOpenItem] = useState<string | null>(null);

  function handleLogout() {
    navigate("/");
  }

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <Header variant="sub" title="Mi Perfil" />
      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-6">
        <section className="bg-white rounded-xl shadow-soft border border-outline-variant/30 p-6 flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-4xl">
              account_circle
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Cliente {tenant.storeName}
            </h2>
            <p className="text-on-surface-variant text-body-sm">
              {user?.email ?? "cliente@correo.com"}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-soft border border-outline-variant/30 divide-y divide-outline-variant/30 mb-8">
          {menuItems.map((item) => {
            const isOpen = openItem === item.id;
            const Panel = item.panel;
            return (
              <div key={item.id}>
                <button
                  onClick={() => setOpenItem(isOpen ? null : item.id)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md flex-1">
                    {item.label}
                  </span>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  >
                    chevron_right
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-surface-container-low/40">
                    <Panel />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white border border-error text-error font-bold py-3 rounded-xl hover:bg-error-container/30 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Salir
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
