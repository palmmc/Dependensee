import fs from 'fs-extra';
import path from 'path';
import { fetchJson } from '../src/Utils/fetch';

const DATA_DIR = 'assets/data';
const OUTPUT_FILE = path.join(DATA_DIR, 'versions.json');
const DEPS_DIR = path.join(process.cwd(), 'src', 'Dependencies');

async function main() {
  await fs.ensureDir(DATA_DIR);

  console.log("Fetching Minecraft versions...");
  const mcManifest = await fetchJson("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  const mcVersions = mcManifest ? mcManifest.versions.map((v: any) => v.id) : [];

  const data: any = {
    minecraft: mcVersions
  };

  console.log(`Searching for collectors in ${DEPS_DIR}...`);
  const files = fs.readdirSync(DEPS_DIR).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const modulePath = `../src/Dependencies/${file.replace('.ts', '.js')}`;
    try {
      const module = await import(modulePath);
      const collector = module.collector;
      if (collector) {
        console.log(`Running collector: ${collector.id}`);
        data[collector.id] = await collector.fetch(mcVersions);
      }
    } catch (err) {
      console.error(`Failed to load collector from ${file}:`, err);
    }
  }

  await fs.writeJson(OUTPUT_FILE, data, { spaces: 2 });
  console.log(`Successfully wrote data to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error("Fatal error in main:", err);
  process.exit(1);
});
