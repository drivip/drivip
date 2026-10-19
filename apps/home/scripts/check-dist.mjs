import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const assetsDir = join(process.cwd(), "dist", "assets");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const offenders = walk(assetsDir).filter((file) =>
  /https?:\/\/(localhost|127\.0\.0\.1)/.test(readFileSync(file, "utf8")),
);

if (offenders.length > 0) {
  console.error("Build abortado: los enlaces contienen localhost:");
  offenders.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
}

console.log("OK: sin enlaces a localhost en el build.");
