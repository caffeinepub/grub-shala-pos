import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Outlet,
} from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "./useActor";

// Always use a fresh anonymous actor for public read queries.
// These endpoints have no auth requirement, so we never need to wait for
// the authenticated actor to initialise before fetching.
async function getAnonymousActor() {
  return createActorWithConfig();
}

// Parses a principal ID string, throwing a human-readable error on failure.
async function parsePrincipal(principalId: string): Promise<Principal> {
  const { Principal } = await import("@icp-sdk/core/principal");
  try {
    return Principal.fromText(principalId);
  } catch {
    throw new Error(
      "Invalid Principal ID format. Make sure you copied the full ID exactly as shown (e.g. 6kfru-4aaaa-aaaab-qaama-cai).",
    );
  }
}

export function useOutlets() {
  return useQuery<Outlet[]>({
    queryKey: ["outlets"],
    queryFn: async () => {
      const actor = await getAnonymousActor();
      return actor.getOutlets();
    },
    staleTime: 0,
    retry: 5,
    retryDelay: 2000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMenuCategories(outletId: string | null) {
  return useQuery<MenuCategory[]>({
    queryKey: ["menuCategories", outletId],
    queryFn: async () => {
      const actor = await getAnonymousActor();
      return actor.getMenuCategories(outletId);
    },
    staleTime: 0,
    retry: 5,
    retryDelay: 2000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMenuItems(outletId: string | null) {
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems", outletId],
    queryFn: async () => {
      const actor = await getAnonymousActor();
      return actor.getMenuItems(outletId);
    },
    staleTime: 0,
    retry: 5,
    retryDelay: 2000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useOrders(
  startTime: bigint | null,
  endTime: bigint | null,
  outletId: string | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", startTime?.toString(), endTime?.toString(), outletId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders(startTime, endTime, outletId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      outletId: string;
      customerMobile: string;
      customerName: string;
      items: Array<OrderItem>;
      subtotal: number;
      taxApplied: boolean;
      taxAmount: number;
      total: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(
        params.outletId,
        params.customerMobile,
        params.customerName,
        params.items,
        params.subtotal,
        params.taxApplied,
        params.taxAmount,
        params.total,
        "completed",
        BigInt(Date.now()),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCustomer(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateOutlet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; active: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createOutlet(params.name, params.active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
  });
}

export function useUpdateOutlet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      active: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOutlet(params.id, params.name, params.active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
  });
}

export function useDeleteOutlet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteOutlet(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
  });
}

export function useCreateMenuCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { outletId: string; name: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMenuCategory(params.outletId, params.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
    },
  });
}

export function useDeleteMenuCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMenuCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
    },
  });
}

export function useCreateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      outletId: string;
      name: string;
      category: string;
      price: number;
      available: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMenuItem(
        params.outletId,
        params.name,
        params.category,
        params.price,
        params.available,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMenuItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      outletId: string;
      name: string;
      category: string;
      price: number;
      available: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMenuItem(
        params.id,
        params.outletId,
        params.name,
        params.category,
        params.price,
        params.available,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimFirstAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useAdmins() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Principal, string]>>({
    queryKey: ["admins"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdmins();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("Not connected");
      const principal = await parsePrincipal(principalId);
      return actor.addAdmin(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("Not connected");
      const principal = await parsePrincipal(principalId);
      return actor.removeAdmin(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}
