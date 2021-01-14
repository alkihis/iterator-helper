const fs = require('fs').promises;

async function main() {
  for (const file of await fs.readdir('./dist-esm')) {
    const name = './dist-esm/' + file;
    if ((await fs.stat(name)).isDirectory()) {
      continue;
    }

    await fs.rename(name, './dist/' + file.replace('.js', '.mjs'));
  }
}

main();
