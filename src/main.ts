import { Dependency } from './Types/Dependency';
import { Settings } from './Types/Settings';
import { App } from './Core/App';

const dependencyModules = import.meta.glob('./Dependencies/*.ts', { eager: true });
const DEPENDENCIES: Dependency[] = Object.values(dependencyModules).map((mod: any) => mod.dependency).filter(Boolean);

const defaultSettings: Settings = {
  matchFirstDeps: false,
  matchFirstMods: false,
  dependencies: {},
  mappings: {},
  modImplementations: []
};

DEPENDENCIES.forEach(d => {
  defaultSettings.dependencies[d.id] = false;
  Object.assign(defaultSettings.mappings, d.defaultMappings);
});

const app = new App(DEPENDENCIES, defaultSettings);
(window as any).app = app;
