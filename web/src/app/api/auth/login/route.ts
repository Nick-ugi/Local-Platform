import type { NextRequest } from "next/server";
import { signIn } from "@/lib/auth/signIn";

/** Log in (USER-02): the tokens go into HttpOnly cookies. */
export function POST(request: NextRequest): Promise<Response> {
  return signIn(request, "/auth/login");
}
