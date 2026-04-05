import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        try {
          return await createActorWithConfig();
        } catch (err) {
          console.error("[useActor] Failed to create anonymous actor:", err);
          throw err;
        }
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      try {
        const actor = await createActorWithConfig(actorOptions);
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await actor._initializeAccessControlWithSecret(adminToken);
        return actor;
      } catch (err) {
        console.error("[useActor] Failed to create authenticated actor:", err);
        throw err;
      }
    },
    // Refresh actor periodically so stale/failed actors recover
    staleTime: 30_000,
    // Retry transient failures before giving up
    retry: 3,
    retryDelay: 1000,
    // Don't hold stale actor in cache too long
    gcTime: 60_000,
    // Don't bubble errors — return null gracefully instead
    throwOnError: false,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
