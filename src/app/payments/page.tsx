"use client";

import { MAX_STALE_TIME } from "~/constants";
import { api } from "~/trpc/react";

const PaymentsPage = () => {
  const utils = api.useUtils();
  const { data } = api.payment.list.useQuery(
    {},
    {
      staleTime: MAX_STALE_TIME,
    },
  );

  const { mutateAsync: cancelPayment } = api.payment.cancel.useMutation({
    onSuccess: async () => {
      await utils.payment.list.invalidate();
      await utils.payment.get.invalidate();
    },
  });

  return (
    <div>
      <h2>Payments</h2>
      <ul>
        {data?.items.map((payment) => {
          return (
            <div key={payment.id}>
              {payment.status}
              <a href={`/products/${payment.id}`}>{payment.id}</a>
              {payment.expiresAt && (
                <span>expiry {payment.expiresAt?.toString()}</span>
              )}
              <button
                onClick={async () => {
                  await cancelPayment({ id: payment.id });
                }}
              >
                Cancel
              </button>
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default PaymentsPage;
