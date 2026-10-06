import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Base de test neuve à chaque lancement, avec les migrations du projet.
export default function setup() {
  rmSync("test.db", { force: true });
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
