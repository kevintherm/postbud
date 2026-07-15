import type { CollectionItem, Environment } from './types';

export const defaultCollections: CollectionItem[] = [
  {
    id: 'col-auth',
    name: 'auth api',
    items: [
      {
        type: 'request',
        request: {
          id: 'req-login',
          name: 'login user',
          method: 'POST',
          url: '/api/v1/login',
          headers: [
            { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
          ],
          queryParams: [],
          body: '{\n  "email": "user@example.com",\n  "password": "password123"\n}',
          bodyType: 'json'
        }
      },
      {
        type: 'folder',
        folder: {
          id: 'folder-auth-tokens',
          name: 'tokens',
          items: [
            {
              type: 'request',
              request: {
                id: 'req-me',
                name: 'get current user',
                method: 'GET',
                url: '/api/v1/me',
                headers: [
                  { id: 'h2', key: 'Authorization', value: 'Bearer jwt.token.here', enabled: true }
                ],
                queryParams: [],
                body: '',
                bodyType: 'none'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'col-users',
    name: 'users api',
    items: [
      {
        type: 'request',
        request: {
          id: 'req-users-list',
          name: 'list users',
          method: 'GET',
          url: '/api/v1/users',
          headers: [],
          queryParams: [
            { id: 'p1', key: 'limit', value: '10', enabled: true },
            { id: 'p2', key: 'offset', value: '0', enabled: true }
          ],
          body: '',
          bodyType: 'none'
        }
      },
      {
        type: 'request',
        request: {
          id: 'req-user-update',
          name: 'update user profile',
          method: 'PUT',
          url: '/api/v1/users/42',
          headers: [
            { id: 'h3', key: 'Content-Type', value: 'application/json', enabled: true }
          ],
          queryParams: [],
          body: '{\n  "name": "walter gropius",\n  "role": "director"\n}',
          bodyType: 'json'
        }
      }
    ]
  },
  {
    id: 'col-debug',
    name: 'debug api',
    items: [
      {
        type: 'folder',
        folder: {
          id: 'folder-errors',
          name: 'error scenarios',
          items: [
            {
              type: 'request',
              request: {
                id: 'req-err-500',
                name: 'trigger 500 error',
                method: 'GET',
                url: '/api/v1/error/500',
                headers: [],
                queryParams: [],
                body: '',
                bodyType: 'none'
              }
            },
            {
              type: 'request',
              request: {
                id: 'req-err-400',
                name: 'trigger 400 error',
                method: 'GET',
                url: '/api/v1/error/400',
                headers: [],
                queryParams: [],
                body: '',
                bodyType: 'none'
              }
            }
          ]
        }
      }
    ]
  }
];

export const defaultEnvironments: Environment[] = [
  {
    id: 'env-local',
    name: 'local',
    variables: [
      { id: 'v1', key: 'base_url', value: 'http://localhost:8001', enabled: true },
      { id: 'v2', key: 'auth_token', value: 'jwt.eyJ1c2VySWQiOjQyLCJleHAiOjE3ODMzMDk2MDB9.postbud', enabled: true }
    ]
  },
  {
    id: 'env-staging',
    name: 'staging',
    variables: [
      { id: 'v3', key: 'base_url', value: 'https://api.staging.postbud.app', enabled: true },
      { id: 'v4', key: 'auth_token', value: 'Bearer jwt.staging.token', enabled: true }
    ]
  },
  {
    id: 'env-production',
    name: 'production',
    variables: [
      { id: 'v5', key: 'base_url', value: 'https://api.postbud.app', enabled: true },
      { id: 'v6', key: 'auth_token', value: 'Bearer jwt.production.token', enabled: true }
    ]
  }
];
