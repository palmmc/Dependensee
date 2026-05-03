import { Dependency } from '../Types/Dependency';
import { ModImplementation, Settings } from '../Types/Settings';
import { RELEASE_REGEX } from '../Utils/constants';
import { lookupModrinth } from '../Utils/fetch';
import { TaglineAnimator } from './TaglineAnimator';

export class App {
  private data: any = null;
  private settings: Settings;
  private resultsCache: Record<string, string> = {};
  private dependencies: Dependency[];
  private defaultSettings: Settings;

  private mcSelect = document.getElementById('mc-version') as HTMLSelectElement;
  private showAllMcCheck = document.getElementById('check-all-versions') as HTMLInputElement;
  private dependencyChecksContainer = document.getElementById('dependency-checks-container') as HTMLDivElement;
  private dependencyInputsContainer = document.getElementById('dependency-inputs') as HTMLDivElement;
  private modImplementationsContainer = document.getElementById('mod-implementations-container') as HTMLDivElement;
  private addModBtn = document.getElementById('add-mod-btn') as HTMLButtonElement;
  private resultsOutput = document.getElementById('results-output') as HTMLTextAreaElement;
  private copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
  private dynamicSettingsContainer = document.getElementById('dynamic-settings') as HTMLDivElement;

  // Settings/toggle
  private matchFirstDepsToggle = document.getElementById('match-first-deps') as HTMLInputElement;
  private matchFirstModsToggle = document.getElementById('match-first-mods') as HTMLInputElement;
  private dependencyChecks: Record<string, HTMLInputElement> = {};
  private dynamicMappingInputs: Record<string, HTMLInputElement> = {};

  constructor(dependencies: Dependency[], defaultSettings: Settings) {
    this.dependencies = dependencies;
    this.defaultSettings = defaultSettings;
    this.settings = { ...defaultSettings };

    this.initDynamicUI();
    this.loadSettings();
    this.initEventListeners();
    this.fetchData();
  }

  private initDynamicUI() {
    this.dependencies.forEach(d => {
      const label = document.createElement('label');
      label.className = 'check-item';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.id = `check-${d.id}`;
      check.checked = this.defaultSettings.dependencies[d.id];
      label.appendChild(check);
      label.appendChild(document.createTextNode(` ${d.name}`));
      this.dependencyChecksContainer.appendChild(label);
      this.dependencyChecks[d.id] = check;

      const section = document.createElement('div');
      section.className = 'settings-section';
      section.innerHTML = `<h3>${d.name} Variables</h3>`;

      Object.keys(d.defaultMappings).forEach(key => {
        const group = document.createElement('div');
        group.className = 'input-group';
        const mLabel = document.createElement('label');
        mLabel.innerText = `${key.replace(/_/g, ' ')} variable`;

        const inputWrapper = document.createElement('div');
        inputWrapper.style.display = 'flex';
        inputWrapper.style.gap = '0.5rem';

        const mInput = document.createElement('input');
        mInput.type = 'text';
        mInput.id = `map-${key}`;
        mInput.placeholder = d.defaultMappings[key];
        mInput.value = '';

        const resetBtn = document.createElement('button');
        resetBtn.innerText = '↺';
        resetBtn.className = 'reset-btn';
        resetBtn.title = 'Reset to default';
        resetBtn.onclick = () => {
          mInput.value = '';
          this.saveSettings();
        };

        inputWrapper.appendChild(mInput);
        inputWrapper.appendChild(resetBtn);

        group.appendChild(mLabel);
        group.appendChild(inputWrapper);
        section.appendChild(group);
        this.dynamicMappingInputs[key] = mInput;
      });
      this.dynamicSettingsContainer.appendChild(section);

      if (d.renderInput) {
        d.renderInput(this.dependencyInputsContainer, () => this.updateResults());
      }
    });
  }

  private loadSettings() {
    const saved = localStorage.getItem('dependensee_settings_v8');
    if (saved) {
      this.settings = { ...this.defaultSettings, ...JSON.parse(saved) };
      this.matchFirstDepsToggle.checked = this.settings.matchFirstDeps ?? false;
      this.matchFirstModsToggle.checked = this.settings.matchFirstMods ?? false;

      if ((this.settings as any).mavenInput) {
        const lines = (this.settings as any).mavenInput.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        lines.forEach((line: string) => {
          if (line.includes('=')) {
            const [key, slug] = line.split('=');
            this.addMod(key.trim(), slug.trim().replace(/^modrinth:/, ''));
          }
        });
        delete (this.settings as any).mavenInput;
      }

      this.renderModImplementations();

      Object.keys(this.dependencyChecks).forEach(id => {
        if (this.settings.dependencies[id] !== undefined) {
          this.dependencyChecks[id].checked = this.settings.dependencies[id];
        }
      });

      Object.keys(this.dynamicMappingInputs).forEach(key => {
        if (this.settings.mappings[key] !== undefined) {
          const val = this.settings.mappings[key];
          this.dynamicMappingInputs[key].value = (val === this.defaultSettings.mappings[key]) ? '' : val;
        }
      });
    }
  }

  private saveSettings() {
    this.settings.matchFirstDeps = this.matchFirstDepsToggle.checked;
    this.settings.matchFirstMods = this.matchFirstModsToggle.checked;

    Object.keys(this.dependencyChecks).forEach(id => {
      this.settings.dependencies[id] = this.dependencyChecks[id].checked;
    });

    Object.keys(this.dynamicMappingInputs).forEach(key => {
      this.settings.mappings[key] = this.dynamicMappingInputs[key].value;
    });

    localStorage.setItem('dependensee_settings_v8', JSON.stringify(this.settings));
    this.updateResults();
  }

  private initEventListeners() {
    this.mcSelect.addEventListener('change', () => this.updateResults());
    this.showAllMcCheck.addEventListener('change', () => this.populateMcVersions());
    this.addModBtn.addEventListener('click', () => this.addMod());

    Object.values(this.dependencyChecks).forEach(check => {
      check.addEventListener('change', () => this.saveSettings());
    });

    Object.values(this.dynamicMappingInputs).forEach(input => {
      input.addEventListener('input', () => this.saveSettings());
    });

    document.getElementById('open-settings')?.addEventListener('click', () => {
      (document.getElementById('modal-overlay') as HTMLElement).style.display = 'flex';
    });
    document.getElementById('close-settings')?.addEventListener('click', () => {
      (document.getElementById('modal-overlay') as HTMLElement).style.display = 'none';
    });
    document.getElementById('close-settings-footer')?.addEventListener('click', () => {
      (document.getElementById('modal-overlay') as HTMLElement).style.display = 'none';
    });

    this.matchFirstDepsToggle.addEventListener('change', () => this.saveSettings());
    this.matchFirstModsToggle.addEventListener('change', () => this.saveSettings());

    this.copyBtn.addEventListener('click', () => {
      this.resultsOutput.select();
      document.execCommand('copy');
      const originalText = this.copyBtn.innerText;
      this.copyBtn.innerText = 'Copied!';
      setTimeout(() => this.copyBtn.innerText = originalText, 2000);
    });
  }

  private async fetchData() {
    try {
      const base = (window as any).DEPENDENSEE_BASE || '';
      const path = (base + '/assets/data/versions.json').replace(/\/+/g, '/');
      console.log(`Fetching data from: ${path}`);

      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} at ${path}`);
      }
      this.data = await response.json();

      this.dependencies.forEach(d => d.init?.(this.data));

      this.populateMcVersions();
      this.updateResults();

      if (this.data.minecraft) {
        new TaglineAnimator(this.dependencies, this.data.minecraft);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      this.resultsOutput.value = `Error: Failed to load version data. Check console for details.`;
    }
  }

  public addMod(variable = '', project = '') {
    const mod: ModImplementation = {
      id: Math.random().toString(36).substr(2, 9),
      variable,
      project,
      matchFirst: this.matchFirstModsToggle.checked,
      releaseTypes: { release: true, beta: false, alpha: false }
    };
    this.settings.modImplementations.push(mod);
    this.renderModImplementations();
    this.saveSettings();
  }

  public removeMod(id: string) {
    this.settings.modImplementations = this.settings.modImplementations.filter(m => m.id !== id);
    this.renderModImplementations();
    this.saveSettings();
  }

  private renderModImplementations() {
    this.modImplementationsContainer.innerHTML = '';
    this.settings.modImplementations.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'mod-card rough-paper';

      card.innerHTML = `
        <button class="remove-mod-btn" onclick="window.app.removeMod('${mod.id}')" title="Remove mod">&times;</button>
        <div class="mod-card-grid">
          <div class="input-group">
            <label>Variable</label>
            <input type="text" id="var-${mod.id}" value="${mod.variable}" placeholder="fabric_api_version">
          </div>
          <div class="input-group">
            <label>Project Slug</label>
            <input type="text" id="proj-${mod.id}" value="${mod.project}" placeholder="fabric-api">
          </div>
        </div>
        <div class="mod-card-footer">
          <div class="release-types">
            <label class="check-item release-check"><input type="checkbox" id="rel-${mod.id}" ${mod.releaseTypes.release ? 'checked' : ''}> Release</label>
            <label class="check-item beta-check"><input type="checkbox" id="beta-${mod.id}" ${mod.releaseTypes.beta ? 'checked' : ''}> Beta</label>
            <label class="check-item alpha-check"><input type="checkbox" id="alpha-${mod.id}" ${mod.releaseTypes.alpha ? 'checked' : ''}> Alpha</label>
          </div>
          <div class="toggle-group">
            <span style="font-size: 0.8rem; font-weight: 600;">Match First</span>
            <label class="switch">
              <input type="checkbox" id="match-${mod.id}" ${mod.matchFirst ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;

      const varInput = card.querySelector(`#var-${mod.id}`) as HTMLInputElement;
      const projInput = card.querySelector(`#proj-${mod.id}`) as HTMLInputElement;
      const matchToggle = card.querySelector(`#match-${mod.id}`) as HTMLInputElement;
      const relCheck = card.querySelector(`#rel-${mod.id}`) as HTMLInputElement;
      const betaCheck = card.querySelector(`#beta-${mod.id}`) as HTMLInputElement;
      const alphaCheck = card.querySelector(`#alpha-${mod.id}`) as HTMLInputElement;

      const update = () => {
        mod.variable = varInput.value;
        mod.project = projInput.value;
        mod.matchFirst = matchToggle.checked;
        mod.releaseTypes.release = relCheck.checked;
        mod.releaseTypes.beta = betaCheck.checked;
        mod.releaseTypes.alpha = alphaCheck.checked;
        this.saveSettings();
      };

      varInput.addEventListener('input', update);
      projInput.addEventListener('input', update);
      matchToggle.addEventListener('change', update);
      relCheck.addEventListener('change', update);
      betaCheck.addEventListener('change', update);
      alphaCheck.addEventListener('change', update);

      this.modImplementationsContainer.appendChild(card);
    });
  }

  private populateMcVersions() {
    if (!this.data) return;
    const currentVal = this.mcSelect.value;
    this.mcSelect.innerHTML = '<option value="">Select Version</option>';

    const showAll = this.showAllMcCheck.checked;

    this.data.minecraft.forEach((v: string) => {
      if (!showAll && !RELEASE_REGEX.test(v)) return;

      const isCompatible = this.dependencies.some(d => d.isAvailable(v));
      if (RELEASE_REGEX.test(v) && !isCompatible) return;

      const option = document.createElement('option');
      option.value = v;
      option.textContent = v;
      if (v === currentVal) option.selected = true;
      this.mcSelect.appendChild(option);
    });
  }

  private updateDependencyAvailability() {
    const mc = this.mcSelect.value;
    if (!this.data) return;

    this.dependencies.forEach(d => {
      const check = this.dependencyChecks[d.id];
      if (check) {
        const available = d.isAvailable(mc);
        check.disabled = !available;
        (check.parentElement as HTMLElement).style.opacity = available ? '1' : '0.5';
        (check.parentElement as HTMLElement).style.pointerEvents = available ? 'auto' : 'none';
      }
    });
  }

  private async updateResults() {
    if (!this.data) return;
    const mc = this.mcSelect.value;

    const activeMappings: Record<string, string> = { ...this.settings.mappings };
    this.dependencies.forEach(d => {
      Object.keys(d.defaultMappings).forEach(key => {
        const customValue = this.dynamicMappingInputs[key]?.value.trim();
        activeMappings[key] = customValue || d.defaultMappings[key];
      });
    });

    const extra = this.dependencies.map(d => JSON.stringify(d.getExtraSettings?.() || {})).join('|');
    const modsStr = JSON.stringify(this.settings.modImplementations);
    const cacheKey = `${mc}|${this.settings.matchFirstDeps}|${this.settings.matchFirstMods}|${Object.values(this.settings.dependencies).join(',')}|${Object.values(activeMappings).join(',')}|${modsStr}|${extra}`;

    this.updateDependencyAvailability();

    for (const d of this.dependencies) {
      const check = this.dependencyChecks[d.id];
      const isEnabled = check && check.checked && !check.disabled;
      d.onStateChange?.(isEnabled);
    }

    if (this.resultsCache[cacheKey]) {
      this.resultsOutput.value = this.resultsCache[cacheKey];
      return;
    }

    if (!mc) {
      this.resultsOutput.value = `Select a Minecraft version to begin.`;
      return;
    }

    let outputLines: string[] = [];

    const mcVersions = this.data.minecraft;
    const startIndex = mcVersions.indexOf(mc);

    for (const d of this.dependencies) {
      const check = this.dependencyChecks[d.id];
      const isEnabled = check && check.checked && !check.disabled;

      if (isEnabled) {
        let results: any[] = [];

        for (let i = startIndex; i >= 0 && i < Math.min(startIndex + 100, mcVersions.length); i++) {
          const testMc = mcVersions[i];
          if (testMc !== mc && !RELEASE_REGEX.test(testMc)) continue;

          results = d.handle(this.data, testMc, activeMappings, this.settings.matchFirstDeps);
          const hasValidData = results.length > 0 && results.every(res => res.value !== 'Not found' && res.value !== 'Error fetching');

          if (hasValidData) {
            break;
          }
        }

        if (results.length > 0) {
          outputLines.push(`# ${d.name}`);
          results.forEach(res => outputLines.push(`${res.label}=${res.value}`));
          outputLines.push("");
        }
      }
    }

    let customResults: string[] = [];

    for (const mod of this.settings.modImplementations) {
      if (mod.variable && mod.project) {
        const allowedTypes = [];
        if (mod.releaseTypes.release) allowedTypes.push('release');
        if (mod.releaseTypes.beta) allowedTypes.push('beta');
        if (mod.releaseTypes.alpha) allowedTypes.push('alpha');

        if (allowedTypes.length === 0) {
          customResults.push(`${mod.variable}=Select release types`);
          continue;
        }

        const version = await lookupModrinth(mod.project, mc, mod.matchFirst, allowedTypes);
        customResults.push(`${mod.variable}=${version}`);
      }
    }

    if (customResults.length > 0) {
      outputLines.push("# Mod Implementations");
      outputLines.push(...customResults);
    }

    const finalOutput = outputLines.join('\n').trim();
    this.resultsCache[cacheKey] = finalOutput;
    this.resultsOutput.value = finalOutput;
  }
}
