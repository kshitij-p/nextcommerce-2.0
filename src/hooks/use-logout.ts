import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useCallback } from "react";

export const useLogout = () => {
  const client = useQueryClient();

  return useCallback(async () => {
    await signOut();
    await client.invalidateQueries();
  }, [client]);
};
