import { Dependency } from '../Types/Dependency';
import { Result } from '../Types/Result';
import { getBestVersion, isWithinRange } from '../Utils/version';

export abstract class BaseDependency implements Dependency {
  abstract id: string;
  abstract name: string;
  abstract defaultMappings: Record<string, string>;
  protected minVersion?: string;
  protected maxVersion?: string;
  protected hasLoader = false;
  protected loaderSelect: HTMLSelectElement | null = null;
  protected loaderContainer: HTMLElement | null = null;

  isAvailable(mc: string): boolean {
    return isWithinRange(mc, this.minVersion || '0.0.0', this.maxVersion);
  }

  init(data: any): void {
    if (this.hasLoader && this.loaderSelect) {
      const loaderData = this.getLoaderData(data);
      if (loaderData) {
        this.loaderSelect.innerHTML = '';
        loaderData.forEach((v: string) => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          this.loaderSelect?.appendChild(opt);
        });
      }
    }
  }

  protected getLoaderData(data: any): string[] | null {
    return data[this.id]?.all_loaders || null;
  }

  renderInput(container: HTMLElement, onChange: () => void): void {
    if (!this.hasLoader) return;

    const group = document.createElement('div');
    group.className = 'input-group';
    group.style.display = 'none';

    const label = document.createElement('label');
    label.innerText = `${this.name} Loader Version`;

    this.loaderSelect = document.createElement('select');
    this.loaderSelect.id = `${this.id}-loader-select`;
    this.loaderSelect.addEventListener('change', onChange);

    group.appendChild(label);
    group.appendChild(this.loaderSelect);
    container.appendChild(group);
    this.loaderContainer = group;
  }

  onStateChange(isEnabled: boolean): void {
    if (this.loaderContainer) {
      this.loaderContainer.style.display = isEnabled ? 'block' : 'none';
    }
  }

  getExtraSettings(): any {
    if (this.hasLoader) {
      return { loader: this.loaderSelect?.value };
    }
    return {};
  }

  protected get loaderValue(): string {
    return this.loaderSelect?.value || 'Not found';
  }

  protected result(label: string, value: string): Result {
    return { label, value };
  }

  protected best(versions: string[] | undefined, matchFirst: boolean, filter?: (v: string) => boolean): string {
    return getBestVersion(versions || [], matchFirst, filter);
  }

  abstract handle(data: any, mc: string, mappings: any, matchFirst: boolean): Result[];
}
