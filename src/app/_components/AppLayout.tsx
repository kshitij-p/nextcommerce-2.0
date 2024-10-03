"use client";

import { Menu } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { Button } from "~/components/ui/button";
import { useLogout } from "~/hooks/use-logout";

const AppLayout = ({ children }: React.PropsWithChildren) => {
  const { status, data: session } = useSession();

  const logout = useLogout();

  return (
    <div className="min-h-screen">
      <header className="sticky inset-0 z-[1000] border-b bg-background/75 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Menu className="h-6 w-6 md:hidden" />
          <Link href="/">
            <h1 className="text-2xl font-semibold">ACME Inc.</h1>
          </Link>

          <div className="flex items-center space-x-4">
            {/* {status === "loading"} */}
            {!session ? (
              <Button
                disabled={status === "loading"}
                onClick={async () => {
                  await signIn("google", { redirect: true });
                }}
              >
                Sign in
              </Button>
            ) : (
              <>
                <Link
                  href={`/account`}
                  className="hidden text-sm hover:underline md:inline-block"
                >
                  Account
                </Link>
                <Link
                  href={`/account/orders`}
                  className="hidden text-sm hover:underline md:inline-block"
                >
                  Orders
                </Link>
                <Link
                  href={`/account/cart`}
                  className="hidden text-sm hover:underline md:inline-block"
                >
                  Cart
                </Link>
                <button
                  className="hidden text-sm hover:underline md:inline-block"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default AppLayout;
