export interface ModImplementation {
  id: string;
  variable: string;
  project: string;
  matchFirst: boolean;
  releaseTypes: {
    release: boolean;
    beta: boolean;
    alpha: boolean;
  };
}

export interface Settings {
  matchFirstDeps: boolean;
  matchFirstMods: boolean;
  dependencies: Record<string, boolean>;
  mappings: Record<string, string>;
  modImplementations: ModImplementation[];
}
