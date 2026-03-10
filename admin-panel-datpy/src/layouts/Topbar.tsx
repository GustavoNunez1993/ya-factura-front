import { Button } from "primereact/button";

interface Props {
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

export default function Topbar({ toggleSidebar, toggleTheme }: Props) {

  return (

    <div
      className="flex align-items-center justify-content-between"
      style={{
        height: 60,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 20px"
      }}
    >

      <div className="flex align-items-center gap-3">

        <Button
          icon="pi pi-bars"
          text
          onClick={toggleSidebar}
        />

        <span style={{ fontWeight: 600 }}>
          Sistema Administrativo
        </span>

      </div>

      <div className="flex align-items-center gap-3">

        <Button
          icon="pi pi-moon"
          text
          onClick={toggleTheme}
        />

        <i className="pi pi-bell" />

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#6366f1",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          G
        </div>

      </div>

    </div>

  );

}