<?php

declare(strict_types=1);

function getAuthHeaderEnv($testCase, string $email = 'envuser@example.com'): array
{
    $testCase->request('POST', '/api/auth/register', [
        'email' => $email,
        'password' => 'password123',
    ]);

    $loginRes = $testCase->request('POST', '/api/auth/login', [
        'email' => $email,
        'password' => 'password123',
    ]);
    
    $loginBody = json_decode((string) $loginRes->getBody(), true);
    return ['Authorization' => 'Bearer ' . $loginBody['token']];
}

test('guest cannot access environments', function () {
    $response = $this->request('GET', '/api/environments');
    expect($response->getStatusCode())->toBe(401);
});

test('user can create environment successfully', function () {
    $headers = getAuthHeaderEnv($this);
    
    $response = $this->request('POST', '/api/environments', [
        'id' => 'env-1',
        'name' => 'Production',
        'variables' => [
            ['key' => 'host', 'value' => 'https://api.production.com', 'enabled' => true]
        ]
    ], $headers);

    expect($response->getStatusCode())->toBe(201);
    
    $body = json_decode((string) $response->getBody(), true);
    expect($body['id'])->toBe('env-1');
    expect($body['name'])->toBe('Production');
    expect($body['variables'][0]['key'])->toBe('host');
});

test('user can fetch their environments', function () {
    $headers = getAuthHeaderEnv($this);

    // Create an env
    $this->request('POST', '/api/environments', [
        'id' => 'env-1',
        'name' => 'Staging',
        'variables' => []
    ], $headers);

    $response = $this->request('GET', '/api/environments', [], $headers);
    expect($response->getStatusCode())->toBe(200);
    
    $body = json_decode((string) $response->getBody(), true);
    expect(count($body))->toBe(1);
    expect($body[0]['name'])->toBe('Staging');
});

test('user can update environment variables', function () {
    $headers = getAuthHeaderEnv($this);

    // Create env
    $this->request('POST', '/api/environments', [
        'id' => 'env-1',
        'name' => 'Staging',
        'variables' => []
    ], $headers);

    // Update variables
    $response = $this->request('PUT', '/api/environments/env-1', [
        'name' => 'Staging Updated',
        'variables' => [
            ['key' => 'apiKey', 'value' => 'secret123', 'enabled' => true]
        ]
    ], $headers);

    expect($response->getStatusCode())->toBe(200);
    $body = json_decode((string) $response->getBody(), true);
    expect($body['name'])->toBe('Staging Updated');
    expect($body['variables'][0]['key'])->toBe('apiKey');
    expect($body['variables'][0]['value'])->toBe('secret123');
});

test('user can delete environment', function () {
    $headers = getAuthHeaderEnv($this);

    $this->request('POST', '/api/environments', [
        'id' => 'env-1',
        'name' => 'Staging',
        'variables' => []
    ], $headers);

    $response = $this->request('DELETE', '/api/environments/env-1', [], $headers);
    expect($response->getStatusCode())->toBe(200);
});
