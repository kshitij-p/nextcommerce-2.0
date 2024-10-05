export const imageAlts = {
  product: (data?: { name?: string | null } | null) =>
    `An image of ${data?.name ?? "Unknown Product"}`,
};
