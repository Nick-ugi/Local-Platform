// Makes an admin account on the server stack running on this PC (deploy/compose.yaml) for the local
// end-to-end tests: signs up through the API, then sets the role in the stack's database, as
// README.md says to. The email and a new random password go to e2e/.auth/admin.json (git-ignored).
// Never used against a deployment.
//   npm run make-admin -w e2e
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const api = process.env.API_URL ?? "https://api.lvh.me";
// Only the local stack: lvh.me and nip.io names point at this PC (127.0.0.1).
if (!/^https:\/\/api\.(lvh\.me|127\.0\.0\.1\.nip\.io)(\/|$)/.test(api)) {
  throw new Error(`make-admin is for the local stack only, not ${api}`);
}

const account = { email: `e2e-admin-${Date.now()}@check.test`, password: randomBytes(18).toString("base64url") };
const context = await request.newContext({ ignoreHTTPSErrors: true });
const signup = await context.post(`${api}/api/v1/auth/signup`, { data: account });
if (signup.status() !== 201) {
  throw new Error(`Sign up answered ${signup.status()}: ${await signup.text()}`);
}
execFileSync(
  "docker",
  [
    "compose", "-f", join(root, "deploy", "compose.yaml"), "--env-file", join(root, "deploy", ".env"),
    "exec", "-T", "db", "psql", "-U", "queenstown", "-d", "queenstown", "-v", "ON_ERROR_STOP=1",
    "-c", `update app_user set role = 'admin' where email = '${account.email}'`,
  ],
  { stdio: "inherit" },
);
mkdirSync(join(here, "..", ".auth"), { recursive: true });
writeFileSync(join(here, "..", ".auth", "admin.json"), JSON.stringify(account, null, 2));
console.log(`Admin ${account.email} is ready (e2e/.auth/admin.json).`);
await context.dispose();
