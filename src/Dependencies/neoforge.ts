import { BaseDependency } from '../Core/BaseDependency';
import { Result } from '../Types/Result';
import { fetchXmlVersions } from '../Utils/fetch';

class NeoForgeDependency extends BaseDependency {
  id = 'neoforge';
  name = 'NeoForge';
  defaultMappings = {
    neoforge: 'neoforge_version',
    neoform: 'neoform_version'
  };

  protected minVersion = '1.20.1';

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[] {
    const parts = mc.split('.');
    const prefix = parts.length >= 2 ? `${parts[1]}.${parts[2] || '0'}` : mc;
    const filter = (v: string) => new RegExp(`^(${prefix.replace(/\./g, '\\.')}|${mc.replace(/\./g, '\\.')})([-.]|$)`).test(v);

    return [
      this.result(mappings.neoforge, this.best(data.neoforge.versions, matchFirst, filter)),
      this.result(mappings.neoform, this.best(data.neoforge.neoform, matchFirst, filter))
    ];
  }
}

export const dependency = new NeoForgeDependency();

export const collector = {
  id: 'neoforge',
  fetch: async () => ({
    versions: await fetchXmlVersions("https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml"),
    neoform: await fetchXmlVersions("https://maven.neoforged.net/releases/net/neoforged/neoform/maven-metadata.xml")
  })
};
