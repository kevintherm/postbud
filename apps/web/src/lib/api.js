const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Fetch the API status
 */
export async function getStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch status');
  }
  return response.json();
}

/**
 * Fetch the list of users
 */
export async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

/**
 * Create a new user
 * @param {Object} user - User object { name, email, role }
 */
export async function createUser(user) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}
