import {
  Drawer,
  List,
  ListItemButton,
  ListItemText
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Marcas", path: "/marcas" }
  ];

  return (
    <Drawer variant="permanent">
      <List>
        {menu.map((item) => (
          <ListItemButton
            key={item.name}
            onClick={() => navigate(item.path)}
          >
            <ListItemText primary={item.name} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}