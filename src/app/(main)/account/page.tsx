"use client";
import Link from "next/link";
import { ShoppingBag, ClipboardList, LogOut } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useLogout } from "~/hooks/use-logout";
import { useSession } from "next-auth/react";

export default function AccountDashboard() {
  const logout = useLogout();
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Account Dashboard</h1>
      {session ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                View, edit and delete your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShoppingBag className="h-12 w-12 text-primary" />
            </CardContent>
            <CardFooter>
              <Link href={`/account/${session.user.id}/products`} passHref>
                <Button className="w-full">Manage Products</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>View your order history</CardDescription>
            </CardHeader>
            <CardContent>
              <ClipboardList className="h-12 w-12 text-primary" />
            </CardContent>
            <CardFooter>
              <Link href="/account/orders" passHref>
                <Button className="w-full">My Orders</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>Log out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <LogOut className="h-12 w-12 text-primary" />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="destructive"
                onClick={async () => {
                  // Add your sign out logic here
                  await logout();
                }}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="flex h-full w-full justify-center text-center">
          You must be logged in to view this page.
        </div>
      )}
    </div>
  );
}
