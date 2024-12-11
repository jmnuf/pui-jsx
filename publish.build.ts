import pkg from "./package.json";
import { readdir, mkdir, rm } from "node:fs/promises";

async function rm_rf(path: string) {
  try {
    await rm(path, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function cpy(input: string, output: string) {
  const f = Bun.file(input);
  try {
    await Bun.write(output, f);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

(async function main() {
  const { $ } = Bun;
  let shellResult;
  // bun run test && bun run build && npm publish
  shellResult = await $`bun run test`.nothrow();
  if (shellResult.exitCode != 0) {
    return;
  }
  shellResult = await $`bun run build`.nothrow();
  if (shellResult.exitCode != 0) {
    return;
  }
  const files = pkg.files;

  try {
    for (const f of files) {
      if (f === "README.md") continue;
      if (f === "static") {
        await mkdir("./static");
        const dir = await readdir(`./dist/${f}`);
        for (const f of dir) {
          console.log("[dist/static]", f, "exists:", await Bun.file(`./dist/static/${f}`).exists());
          await cpy(`./dist/static/${f}`, `./static/${f}`);
        }
        continue;
      }
      console.log("[dist]", f, "exists:", await Bun.file(`./dist/${f}`).exists());
      await cpy(`./dist/${f}`, `./${f}`);
    }
  } catch (err) {
    console.error(err);
    await rm_rf("./static");
    return;
  }

  // process.stdout.write("Press enter to continue... ");
  // for await (const _ of console) {
  //   break;
  // }

  await $`npm publish`.nothrow();

  try {
    for (const f of files) {
      if (f === "README.md") continue;
      if (f === "static") {
        await rm_rf("./static");
        continue;
      }
      await rm(`./${f}`, { force: true });
    }
  } catch (err) {
    console.error(err);
  }

})()
