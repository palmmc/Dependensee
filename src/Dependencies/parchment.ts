import { BaseDependency } from '../Core/BaseDependency';
import { Result } from '../Types/Result';
import { fetchXmlVersions } from '../Utils/fetch';

class ParchmentDependency extends BaseDependency {
  id = 'parchment';
  name = 'Parchment';
  defaultMappings = {
    parchment: 'parchment_version'
  };

  protected minVersion = '1.16.5';
  protected maxVersion = '1.21.11';

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[] {
    const version = this.best(data.parchment[mc], matchFirst);
    return version !== 'Not found' ? [this.result(mappings.parchment, version)] : [];
  }
}

export const dependency = new ParchmentDependency();

export const collector = {
  id: 'parchment',
  fetch: async (mcVersions: string[]) => {
    console.log("Fetching ParchmentMC data...");
    const data: Record<string, string[]> = {};
    const relevant = mcVersions.filter(v => {
      const parts = v.split('.').map(Number);
      return parts[0] === 1 && parts[1] >= 16;
    });

    for (const gv of relevant) {
      const url = `https://ldtteam.jfrog.io/artifactory/parchmentmc-internal/org/parchmentmc/data/parchment-${gv}/maven-metadata.xml`;
      const versions = await fetchXmlVersions(url);
      if (versions.length > 0) data[gv] = versions;
    }
    return data;
  }
};
