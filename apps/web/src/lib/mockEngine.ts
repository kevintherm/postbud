import type { HeaderOrParam } from './store.svelte';

export interface SimulatedResponse {
  status: number;
  statusText: string;
  body: string;
  headers: Array<{ key: string; value: string }>;
}

export function simulateRequest(
  method: string,
  url: string,
  body: string,
  headers: HeaderOrParam[],
  queryParams: HeaderOrParam[],
  activeEnvName: string
): SimulatedResponse {
  const urlPath = url.trim().toLowerCase();
  let status = 200;
  let statusText = 'OK';
  let bodyData: any = null;
  const respHeaders = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Server', value: 'Stout/RoadRunner (PHP)' },
    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }
  ];

  if (urlPath.includes('/login')) {
    if (method === 'POST') {
      status = 200;
      statusText = 'OK';
      bodyData = {
        status: 'success',
        token: 'jwt.eyJ1c2VySWQiOjQyLCJleHAiOjE3ODMzMDk2MDB9.postbud',
        user: {
          id: 42,
          email: 'user@example.com',
          username: 'bauhaus_dev',
          role: 'admin',
          sync_enabled: true,
          created_at: '2026-07-15T00:00:00Z'
        }
      };
    } else {
      status = 405;
      statusText = 'Method Not Allowed';
      bodyData = {
        error: 'Method Not Allowed',
        message: `The endpoint /api/v1/login does not support ${method}. Use POST.`
      };
    }
  } else if (urlPath.includes('/register')) {
    if (method === 'POST') {
      try {
        const parsed = JSON.parse(body || '{}');
        status = 201;
        statusText = 'Created';
        bodyData = {
          status: 'success',
          token: 'jwt.eyJ1c2VySWQiOjQyLCJleHAiOjE3ODMzMDk2MDB9.postbud',
          user: {
            id: 42,
            email: parsed.email || 'user@example.com',
            username: parsed.username || 'new_user',
            role: 'user',
            sync_enabled: true,
            created_at: new Date().toISOString()
          }
        };
      } catch (e) {
        status = 400;
        statusText = 'Bad Request';
        bodyData = {
          error: 'Bad Request',
          message: 'Invalid registration payload.'
        };
      }
    } else {
      status = 405;
      statusText = 'Method Not Allowed';
      bodyData = {
        error: 'Method Not Allowed',
        message: `The endpoint /api/v1/register does not support ${method}. Use POST.`
      };
    }
  } else if (urlPath.includes('/me')) {
    status = 200;
    statusText = 'OK';
    bodyData = {
      id: 42,
      email: 'user@example.com',
      username: 'bauhaus_dev',
      sync_enabled: true
    };
  } else if (urlPath.includes('/users')) {
    if (method === 'GET') {
      status = 200;
      statusText = 'OK';
      bodyData = [
        { id: 1, name: 'walter gropius', role: 'founder', born: 1883 },
        { id: 2, name: 'herbert bayer', role: 'typography director', born: 1900 },
        { id: 3, name: 'wassily kandinsky', role: 'color theory master', born: 1866 },
        { id: 4, name: 'paul klee', role: 'form master', born: 1879 }
      ];
    } else if (method === 'PUT') {
      try {
        const parsed = JSON.parse(body || '{}');
        status = 200;
        statusText = 'OK';
        bodyData = {
          status: 'updated',
          id: 42,
          updated_fields: parsed,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        status = 400;
        statusText = 'Bad Request';
        bodyData = {
          error: 'Bad Request',
          message: 'Invalid JSON request body payload.'
        };
      }
    } else {
      status = 200;
      bodyData = { message: `Request executed successfully with method ${method}.` };
    }
  } else if (urlPath.includes('/error/500')) {
    status = 500;
    statusText = 'Internal Server Error';
    bodyData = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred in Stout\\Database\\QueryBuilder',
      exception: 'UniqueConstraintViolationException',
      file: 'QueryBuilder.php',
      line: 148
    };
  } else if (urlPath.includes('/error/400')) {
    status = 400;
    statusText = 'Bad Request';
    bodyData = {
      error: 'Bad Request',
      message: 'Required query parameter "limit" was empty or non-numeric.'
    };
  } else {
    status = 200;
    statusText = 'OK';
    bodyData = {
      message: 'hello from postbud mock engine!',
      method: method,
      endpoint: urlPath,
      timestamp: new Date().toISOString(),
      active_environment: activeEnvName,
      echo: {
        queryParams: queryParams.filter(q => q.enabled).reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>),
        headers: headers.filter(h => h.enabled).reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>),
        body: body
      }
    };
  }

  return {
    status,
    statusText,
    body: JSON.stringify(bodyData, null, 2),
    headers: respHeaders
  };
}
