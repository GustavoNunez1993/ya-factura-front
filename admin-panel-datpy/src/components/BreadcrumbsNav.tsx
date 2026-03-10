import { useLocation } from "react-router-dom";

export default function BreadcrumbsNav() {

  const location = useLocation();

  const paths = location.pathname.split("/").filter(Boolean);

  return (

    <div style={{ marginBottom: 16 }}>

      {paths.map((p, index) => (

        <span key={index}>

          {p}

          {index < paths.length - 1 && " / "}

        </span>

      ))}

    </div>

  );

}