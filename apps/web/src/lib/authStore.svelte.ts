import { getMe } from './api';
import type { User } from './types';

export class AuthStore {
  currentUser = $state<User | null>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('pb_user') && localStorage.getItem('pb_token'))
      ? JSON.parse(localStorage.getItem('pb_user')!)
      : null
  );
  showAuthModal = $state<'login' | 'register' | null>(null);
  showProfileModal = $state<boolean>(false);

  login(user: User, token: string) {
    this.currentUser = user;
    localStorage.setItem('pb_user', JSON.stringify(user));
    localStorage.setItem('pb_token', token);
    this.showAuthModal = null;
  }

  register(user: User, token: string) {
    this.currentUser = user;
    localStorage.setItem('pb_user', JSON.stringify(user));
    localStorage.setItem('pb_token', token);
    this.showAuthModal = null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pb_user');
    localStorage.removeItem('pb_token');
    this.showProfileModal = false;
  }

  updateProfile(name: string, email: string, syncEnabled: boolean) {
    if (this.currentUser) {
      this.currentUser.name = name;
      this.currentUser.email = email;
      this.currentUser.sync_enabled = syncEnabled;
      localStorage.setItem('pb_user', JSON.stringify(this.currentUser));
    }
  }

  async init(): Promise<void> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_token') : null;
    if (!token) {
      this.currentUser = null;
      return;
    }
    try {
      const user = await getMe();
      this.currentUser = user;
      localStorage.setItem('pb_user', JSON.stringify(user));
    } catch {
      this.currentUser = null;
      localStorage.removeItem('pb_user');
      localStorage.removeItem('pb_token');
    }
  }
}

export const authStore = new AuthStore();
