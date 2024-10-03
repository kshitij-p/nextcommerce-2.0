"use client";

import { LogOut, Menu } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import { useLogout } from "~/hooks/use-logout";

const AppLayout = ({ children }: React.PropsWithChildren) => {
  const { status, data: session } = useSession();

  const logout = useLogout();

  return (
    <div className="min-h-screen">
      <header className="sticky inset-0 z-40 border-b bg-background/75 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Drawer direction="left">
            <DrawerTrigger asChild>
              <Button className="md:hidden" variant="ghost">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-screen w-[310px]" showBezel={false}>
              <div className="mx-auto h-full w-full max-w-sm">
                <div className="flex h-full w-full flex-col gap-4 p-6 pb-0">
                  <Link href={`/account`} className="text-lg hover:underline">
                    Account
                  </Link>
                  <Link
                    href={`/account/orders`}
                    className="text-lg hover:underline"
                  >
                    Orders
                  </Link>
                  <Link
                    href={`/account/cart`}
                    className="text-lg hover:underline"
                  >
                    Cart
                  </Link>
                  <button
                    className="text-start text-lg hover:underline"
                    onClick={async () => {
                      await logout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Link href="/">
            <h1 className="text-2xl font-semibold">ACME Inc.</h1>
          </Link>
          <button
            className="inline-block md:hidden"
            onClick={async () => await logout()}
          >
            <LogOut className="h-6 w-6" />
          </button>

          <div className="hidden items-center space-x-4 md:flex">
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
