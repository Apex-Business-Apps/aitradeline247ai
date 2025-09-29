import { Outlet } from "react-router-dom";
import HeaderBar from "@/components/HeaderBar";
import SecurityHeaders from "@/components/security/SecurityHeaders";

export default function AppLayout() {
  return (
    <>
      <SecurityHeaders />
      <div className="min-h-screen bg-background">
        <HeaderBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </>
  );
}