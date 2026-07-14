import * as idb from '../db.js';

class IndexedDbRepository {
  async getCollections() {
    return idb.getCollections();
  }
  async saveCollection(collection) {
    return idb.saveCollection(collection);
  }
  async deleteCollection(id) {
    return idb.deleteCollection(id);
  }
  async saveRequestTemplate(collectionId, req) {
    const collections = await idb.getCollections();
    const col = collections.find(c => c.id === collectionId);
    if (col) {
      if (!col.requests) col.requests = [];
      const idx = col.requests.findIndex(r => r.id === req.id);
      if (idx !== -1) {
        col.requests[idx] = req;
      } else {
        col.requests.push(req);
      }
      await idb.saveCollection(col);
    }
  }
  async deleteRequestTemplate(collectionId, requestId) {
    const collections = await idb.getCollections();
    const col = collections.find(c => c.id === collectionId);
    if (col && col.requests) {
      col.requests = col.requests.filter(r => r.id !== requestId);
      await idb.saveCollection(col);
    }
  }
  async getEnvironments() {
    return idb.getEnvironments();
  }
  async saveEnvironment(environment) {
    return idb.saveEnvironment(environment);
  }
  async deleteEnvironment(id) {
    return idb.deleteEnvironment(id);
  }
  async getHistory() {
    return idb.getHistory();
  }
  async saveHistoryEntry(entry) {
    return idb.saveHistoryEntry(entry);
  }
  async deleteHistoryEntry(id) {
    return idb.deleteHistoryEntry(id);
  }
  async clearHistory() {
    return idb.clearHistory();
  }
}

class CloudRepository {
  constructor(token) {
    this.token = token;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async getCollections() {
    const res = await fetch('/api/collections', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Cloud sync failed');
    return res.json();
  }

  async saveCollection(collection) {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id: collection.id, name: collection.name }),
    });
    if (!res.ok) throw new Error('Cloud save collection failed');
    
    for (const req of collection.requests || []) {
      await this.saveRequestTemplate(collection.id, req);
    }
  }

  async deleteCollection(id) {
    const res = await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Cloud delete collection failed');
  }

  async saveRequestTemplate(collectionId, req) {
    try {
      const putRes = await fetch(`/api/collections/${collectionId}/requests/${req.id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });
      if (putRes.status === 404) {
        await fetch(`/api/collections/${collectionId}/requests`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(req),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async deleteRequestTemplate(collectionId, requestId) {
    const res = await fetch(`/api/collections/${collectionId}/requests/${requestId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Cloud delete request failed');
  }

  async getEnvironments() {
    const res = await fetch('/api/environments', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Cloud sync failed');
    return res.json();
  }

  async saveEnvironment(environment) {
    try {
      const putRes = await fetch(`/api/environments/${environment.id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(environment),
      });
      if (putRes.status === 404) {
        await fetch('/api/environments', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(environment),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async deleteEnvironment(id) {
    const res = await fetch(`/api/environments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Cloud delete environment failed');
  }

  async getHistory() {
    const res = await fetch('/api/history', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Cloud sync failed');
    return res.json();
  }

  async saveHistoryEntry(entry) {
    await fetch('/api/history', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entry),
    });
  }

  async deleteHistoryEntry(id) {
    await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async clearHistory() {
    await fetch('/api/history', {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export function getRepository(token = null) {
  if (token) {
    return new CloudRepository(token);
  }
  return new IndexedDbRepository();
}
