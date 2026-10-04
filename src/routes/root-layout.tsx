import { Outlet } from "@tanstack/react-router";

import { AuthLayer } from "@/components/auth/AuthLayer";

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <AuthLayer />
    </>
  );
}
