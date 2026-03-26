import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChefHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  ShieldAlert,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useIsAdmin } from "../../hooks/useQueries";
import CustomersTab from "./CustomersTab";
import MenuTab from "./MenuTab";
import OrdersTab from "./OrdersTab";
import OutletsTab from "./OutletsTab";

type AdminTab = "orders" | "customers" | "outlets" | "menu";

interface Props {
  onGoPOS: () => void;
}

export default function AdminPanel({ onGoPOS }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const { login, clear, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const isLoggedIn = !!identity;

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "orders",
      label: "Orders",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "customers",
      label: "Customers",
      icon: <Users className="w-4 h-4" />,
    },
    { id: "outlets", label: "Outlets", icon: <Store className="w-4 h-4" /> },
    {
      id: "menu",
      label: "Menu Items",
      icon: <UtensilsCrossed className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-charcoal flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-charcoal-light">
          <img
            src="/assets/uploads/grub_logo_white.jpg-019d2879-724e-76fe-b488-5ce5d0569f40-1.jpeg"
            alt="Grub Shala"
            className="w-36 h-12 object-contain"
          />
        </div>

        {isLoggedIn && isAdmin && (
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">
              Management
            </p>
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`admin.${item.id}.tab`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-amber-600/20 text-amber-300"
                    : "text-sidebar-foreground/70 hover:bg-charcoal-light"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="p-3 border-t border-charcoal-light space-y-2 mt-auto">
          <button
            type="button"
            data-ocid="admin.pos.link"
            onClick={onGoPOS}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-charcoal-light text-xs transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Back to POS
          </button>
          {isLoggedIn && (
            <button
              type="button"
              data-ocid="admin.logout.button"
              onClick={clear}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/70 hover:bg-charcoal-light text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
          <h1 className="text-[22px] font-bold text-foreground">Admin Panel</h1>
          {isLoggedIn && (
            <span className="text-sm text-muted-foreground">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isInitializing || isAdminLoading ? (
            <div
              data-ocid="admin.loading_state"
              className="flex flex-col gap-4"
            >
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !isLoggedIn ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Sign in with Internet Identity to access the admin panel.
                </p>
              </div>
              <Button
                data-ocid="admin.login.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 text-base"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Admin Login"
                )}
              </Button>
            </motion.div>
          ) : !isAdmin ? (
            <div
              data-ocid="admin.error_state"
              className="flex flex-col items-center justify-center h-full gap-4"
            >
              <ShieldAlert className="w-12 h-12 text-destructive" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground text-sm">
                You don't have admin privileges.
              </p>
              <Button variant="outline" onClick={clear}>
                Sign out
              </Button>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "customers" && <CustomersTab />}
              {activeTab === "outlets" && <OutletsTab />}
              {activeTab === "menu" && <MenuTab />}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
