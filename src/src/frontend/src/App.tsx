import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPanel from "./components/admin/AdminPanel";
import POSScreen from "./components/pos/POSScreen";

export type AppView = "pos" | "admin";

export default function App() {
  const [view, setView] = useState<AppView>("pos");

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Toaster richColors position="top-right" />
      {view === "pos" ? (
        <POSScreen onGoAdmin={() => setView("admin")} />
      ) : (
        <AdminPanel onGoPOS={() => setView("pos")} />
      )}
    </div>
  );
}
