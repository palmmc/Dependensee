import { RELEASE_REGEX } from '../Utils/constants';

export class TaglineAnimator {
  private depSpan = document.getElementById('dynamic-dependency') as HTMLElement;
  private verSpan = document.getElementById('dynamic-version') as HTMLElement;
  private subtitle = document.querySelector('.subtitle') as HTMLElement;
  private dependencies: any[] = [];
  private versions: string[] = [];
  private lastDepId = 'fabric';
  private lastVer = '1.21.1'

  constructor(dependencies: any[], versions: string[]) {
    this.dependencies = dependencies;
    this.versions = versions.filter(v => RELEASE_REGEX.test(v));

    if (this.depSpan && this.verSpan) {
      setInterval(() => this.animate(), 5000);
    }
  }

  private animate() {
    let dep;
    let availableVersions: string[] = [];

    // Pick dependency with at least one version
    do {
      dep = this.dependencies[Math.floor(Math.random() * this.dependencies.length)];
      availableVersions = this.versions.filter(v => dep.isAvailable(v));
    } while ((dep.id === this.lastDepId || availableVersions.length === 0) && this.dependencies.length > 1);

    // Pick new version
    let nextVer;
    do {
      nextVer = availableVersions[Math.floor(Math.random() * availableVersions.length)];
    } while (nextVer === this.lastVer && availableVersions.length > 1);

    this.lastDepId = dep.id;
    this.lastVer = nextVer;

    this.transition(this.depSpan, dep.name);
    this.transition(this.verSpan, nextVer);
  }

  private transition(el: HTMLElement, nextText: string) {
    el.classList.remove('enter');
    this.subtitle.classList.remove('shake');
    el.classList.add('exit');

    setTimeout(() => {
      el.innerText = nextText;
      el.classList.remove('exit');
      el.classList.add('enter');

      setTimeout(() => {
        this.subtitle.classList.add('shake');
      }, 250);
    }, 250);
  }
}
