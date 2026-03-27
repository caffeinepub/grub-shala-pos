import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Outlet,
} from "../backend";
import { useActor } from "./useActor";

export function useOutlets() {
  const { actor, isFetching } = useActor();
  return useQuery<Outlet[]>({
    queryKey: ["outlets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutlets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMenuCategories(outletId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MenuCategory[]>({
    queryKey: ["menuCategories", outletId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMenuCategories(outletId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMenuItems(outletId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems", outletId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMenuItems(outletId);
    },
    enabled: !!actor && !isFetching,
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
