
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user (${response.status})`);
      }

      return await response.json();
    },
    retry: (failureCount, queryError) => {
      // A temporary proxy/server failure must not look like a logout.
      // A real 401 is represented by null and is never retried.
      return !queryError.message.includes("(401)") && failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    logout: () => logoutMutation.mutate(),
  };
}
