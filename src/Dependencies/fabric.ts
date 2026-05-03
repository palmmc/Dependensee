import { BaseDependency } from '../Core/BaseDependency';
import { Result } from '../Types/Result';
import { fetchJson, fetchMavenMap } from '../Utils/fetch';

class FabricDependency extends BaseDependency {
  id = 'fabric';
  name = 'Fabric';
  defaultMappings = {
    fabric_loader: 'fabric_loader_version',
    fabric_api: 'fabric_api_version'
  };

  protected minVersion = '1.14.0';
  protected hasLoader = true;

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[] {
    return [
      this.result(mappings.fabric_loader, this.loaderValue),
      this.result(mappings.fabric_api, this.best(data.fabric.api[mc], matchFirst))
    ];
  }
}

export const dependency = new FabricDependency();

export const collector = {
  id: 'fabric',
  fetch: async () => ({
    all_loaders: (await fetchJson("https://meta.fabricmc.net/v2/versions/loader")).map((v: any) => v.version),
    api: await fetchMavenMap("https://maven.fabricmc.net/net/fabricmc/fabric-api/fabric-api/maven-metadata.xml", "+")
  })
};
