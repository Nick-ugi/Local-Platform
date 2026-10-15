import type { NextRequest } from "next/server";
import { signIn } from "@/lib/auth/signIn";

/** Sign up (USER-01): the new account is signed in at once. */
export function POST(request: NextRequest): Promise<Response> {
  return signIn(request, "/auth/signup");
}
