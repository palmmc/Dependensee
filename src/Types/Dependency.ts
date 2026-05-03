import { Result } from './Result';

export interface Dependency {
  id: string;
  name: string;
  defaultMappings: Record<string, string>;

  init?(data: any): void;
  renderInput?(container: HTMLElement, onChange: () => void): void;
  onStateChange?(isEnabled: boolean): void;
  getExtraSettings?(): any;
  isAvailable(mc: string): boolean;

  handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[];
}
