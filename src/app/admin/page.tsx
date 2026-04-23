import { AdminDashboard } from "./admin-dashboard";
import { getAdminDashboardData } from "./admin-data";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboard {...data} section="overview" />;
}
