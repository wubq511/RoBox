import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/prompts/:path*",
    "/skills/:path*",
    "/tools/:path*",
    "/favorites/:path*",
    "/settings/:path*",
  ],
};
