import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/routes/_app";
import Index from "@/pages/Index";
import Settings from "@/routes/settings";
import DemoDashboard from "@/routes/demo/dashboard";
import Inbox from "@/routes/inbox";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/settings", 
    element: <Settings />,
  },
  {
    path: "/demo/dashboard",
    element: <DemoDashboard />,
  },
  {
    path: "/inbox",
    element: <Inbox />,
  },
]);