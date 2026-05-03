import { BaseDependency } from '../Core/BaseDependency';
import { Result } from '../Types/Result';
import { fetchXmlVersions } from '../Utils/fetch';

class ForgeDependency extends BaseDependency {
  id = 'forge';
  name = 'Forge';
  defaultMappings = {
    forge: 'forge_version'
  };

  protected minVersion = '1.12.2';

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[] {
    const filter = (v: string) => new RegExp(`^${mc.replace(/\./g, '\\.')}([-.]|$)`).test(v);
    return [
      this.result(mappings.forge, this.best(data.forge.versions, matchFirst, filter))
    ];
  }
}

export const dependency = new ForgeDependency();

export const collector = {
  id: 'forge',
  fetch: async () => ({
    versions: await fetchXmlVersions("https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml")
  })
};
