import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();
const cache: Record<string, any> = {};

export async function lookupModrinth(
  slug: string,
  mc: string,
  matchFirst: boolean,
  allowedTypes: string[] = ['release', 'beta', 'alpha']
): Promise<string> {
  const typesKey = allowedTypes.sort().join(',');
  const cacheKey = `modrinth|${slug}|${mc}|${matchFirst}|${typesKey}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://api.modrinth.com/v2/project/${slug}/version?game_versions=["${mc}"]`;
    const response = await fetch(url);
    if (!response.ok) return 'Error fetching';

    const versions = await response.json();
    if (versions.length === 0) return 'Not found';

    const filtered = versions.filter((v: any) => allowedTypes.includes(v.version_type));
    if (filtered.length === 0) return 'Filtered release found';

    filtered.sort((a: any, b: any) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime());

    const result = matchFirst ? filtered[filtered.length - 1].version_number : filtered[0].version_number;
    cache[cacheKey] = result;
    return result;
  } catch (e) {
    return 'Modrinth Error';
  }
}

export async function fetchJson(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error);
    return null;
  }
}

export async function fetchXmlVersions(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();
    const jsonObj = parser.parse(text);
    const versions = jsonObj.metadata?.versioning?.versions?.version;
    if (Array.isArray(versions)) {
      return versions;
    } else if (typeof versions === 'string') {
      return [versions];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching XML version stuff from ${url}:`, error);
    return [];
  }
}

export async function fetchMavenMap(url: string, splitChar: string): Promise<Record<string, string[]>> {
  const versions = await fetchXmlVersions(url);
  const map: Record<string, string[]> = {};
  for (const v of versions) {
    if (v.includes(splitChar)) {
      const gv = v.split(splitChar)[1];
      if (!map[gv]) map[gv] = [];
      map[gv].push(v);
    }
  }
  return map;
}
