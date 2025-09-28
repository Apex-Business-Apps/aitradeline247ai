import { Outlet } from "react-router-dom";
import HeaderBar from "@/components/HeaderBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}