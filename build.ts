const results = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'linked',
});

for (const log of results.logs) {
  if (log.level == "error") {
    console.error(log);
  } else if (log.level == "warning") {
    console.warn(log);
  } else if (log.level == "info") {
    console.log(log);
  }
}

if (results.success) {
  const { $ } = Bun;
  const pwd = (await $`pwd`.text()).trim();
  for (const artifact of results.outputs) {
    let path = artifact.path.trim();
    if (path.startsWith(pwd)) {
      path = path.substring(pwd.length);
    }
    path = path.replace(/\\/g, "/");
    console.log(`[INFO] Built ${artifact.kind}: .${path}`);
  }

  const { exitCode } = await $`bunx tsc -p ./tsconfig.declarations.json `.nothrow();
  if (exitCode === 0) {
    console.log("[INFO] Type declarations created");
  } else {
    console.error("[ERROR] Failed to generate type declarations");
  }
}
