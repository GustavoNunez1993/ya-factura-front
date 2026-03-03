import { Typography, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

export default function Dashboard() {
  return (
    <>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            Ventas Hoy
          </Paper>
        </Grid>

        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            Facturas Emitidas
          </Paper>
        </Grid>

        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            Productos Activos
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}