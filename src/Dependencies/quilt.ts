import { BaseDependency } from '../Core/BaseDependency';
import { Result } from '../Types/Result';
import { isWithinRange } from '../Utils/version';
import { fetchJson, fetchMavenMap } from '../Utils/fetch';

class QuiltDependency extends BaseDependency {
  id = 'quilt';
  name = 'Quilt';
  defaultMappings = {
    quilt_loader: 'quilt_loader_version',
    quilt_qsl: 'quilt_qsl_version'
  };

  protected minVersion = '1.14.0';
  protected hasLoader = true;

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[] {
    const results = [this.result(mappings.quilt_loader, this.loaderValue)];
    if (isWithinRange(mc, '1.18.2', '1.21.1')) {
      results.push(this.result(mappings.quilt_qsl, this.best(data.quilt.qsl[mc], matchFirst)));
    }
    return results;
  }
}

export const dependency = new QuiltDependency();

export const collector = {
  id: 'quilt',
  fetch: async () => ({
    all_loaders: (await fetchJson("https://meta.quiltmc.org/v3/versions/loader")).map((v: any) => v.version),
    qsl: await fetchMavenMap("https://maven.quiltmc.org/repository/release/org/quiltmc/qsl/maven-metadata.xml", "+")
  })
};
