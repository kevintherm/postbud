import { generateId } from './utils';
import type { Environment } from './types';

export class EnvironmentStore {
  environments = $state<Environment[]>([
    { id: 'env-local', name: 'local', variables: [
      { id: 'v1', key: 'base_url', value: 'http://localhost', enabled: true },
    ]}
  ]);
  activeEnvironmentId = $state<string>('env-local');

  get activeEnvironment() {
    return this.environments.find(e => e.id === this.activeEnvironmentId);
  }

  addEnv(name: string) {
    if (name.trim()) {
      this.environments.push({
        id: 'env-' + generateId(),
        name: name.trim(),
        variables: []
      });
    }
  }

  updEnv(id: string, name: string) {
    const e = this.environments.find(e => e.id === id);
    if (e && name.trim()) e.name = name.trim();
  }

  delEnv(id: string) {
    if (this.environments.length <= 1) return;
    const i = this.environments.findIndex(e => e.id === id);
    if (i !== -1) this.environments.splice(i, 1);
    if (this.activeEnvironmentId === id) {
      this.activeEnvironmentId = this.environments[0].id;
    }
  }

  addVar(eid: string) {
    const e = this.environments.find(e => e.id === eid);
    if (e) {
      e.variables.push({
        id: 'var-' + generateId(),
        key: '',
        value: '',
        enabled: true
      });
    }
  }

  delVar(eid: string, vid: string) {
    const e = this.environments.find(e => e.id === eid);
    if (e) {
      const i = e.variables.findIndex(v => v.id === vid);
      if (i !== -1) e.variables.splice(i, 1);
    }
  }

  resolveVars(t: string): string {
    if (!t) return t;
    const a = this.activeEnvironment;
    if (!a) return t;
    let r = t;
    for (const v of a.variables) {
      if (v.enabled && v.key.trim()) {
        r = r.replaceAll(`{{${v.key.trim()}}}`, v.value);
      }
    }
    return r;
  }
}

export const environmentStore = new EnvironmentStore();
