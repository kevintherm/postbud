<?php

declare(strict_types=1);

function getAuthHeader($testCase, string $email = 'user@example.com'): array
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

test('guest cannot access collections', function () {
    $response = $this->request('GET', '/api/collections');
    expect($response->getStatusCode())->toBe(401);
});

test('user can create collection successfully', function () {
    $headers = getAuthHeader($this);
    
    $response = $this->request('POST', '/api/collections', [
        'id' => 'col-123',
        'name' => 'My API Suite',
    ], $headers);

    expect($response->getStatusCode())->toBe(201);
    
    $body = json_decode((string) $response->getBody(), true);
    expect($body['id'])->toBe('col-123');
    expect($body['name'])->toBe('My API Suite');
});

test('user can fetch their collections', function () {
    $headers = getAuthHeader($this);

    // Create a collection
    $this->request('POST', '/api/collections', [
        'id' => 'col-1',
        'name' => 'Auth Endpoints',
    ], $headers);

    $response = $this->request('GET', '/api/collections', [], $headers);
    expect($response->getStatusCode())->toBe(200);
    
    $body = json_decode((string) $response->getBody(), true);
    expect(count($body))->toBe(1);
    expect($body[0]['name'])->toBe('Auth Endpoints');
});

test('user cannot fetch another users collections', function () {
    $headers1 = getAuthHeader($this, 'user1@example.com');
    $headers2 = getAuthHeader($this, 'user2@example.com');

    // Create collection for user 1
    $this->request('POST', '/api/collections', [
        'id' => 'col-u1',
        'name' => 'Private Col',
    ], $headers1);

    // Try fetching with user 2
    $response = $this->request('GET', '/api/collections', [], $headers2);
    $body = json_decode((string) $response->getBody(), true);
    
    expect(count($body))->toBe(0);
});

test('user can add request template to collection', function () {
    $headers = getAuthHeader($this);

    // Create collection
    $this->request('POST', '/api/collections', [
        'id' => 'col-1',
        'name' => 'Auth Endpoints',
    ], $headers);

    // Add request template
    $response = $this->request('POST', '/api/collections/col-1/requests', [
        'id' => 'req-1',
        'name' => 'Login Request',
        'method' => 'POST',
        'url' => '{{host}}/api/auth/login',
        'headers' => [['key' => 'Content-Type', 'value' => 'application/json', 'enabled' => true]],
        'params' => [],
        'body' => '{"email": "test@example.com"}',
    ], $headers);

    expect($response->getStatusCode())->toBe(201);
    $body = json_decode((string) $response->getBody(), true);
    expect($body['id'])->toBe('req-1');
    expect($body['name'])->toBe('Login Request');
});

test('user can update request template', function () {
    $headers = getAuthHeader($this);

    // Create collection & request
    $this->request('POST', '/api/collections', ['id' => 'col-1', 'name' => 'Auth'], $headers);
    $this->request('POST', '/api/collections/col-1/requests', [
        'id' => 'req-1',
        'name' => 'Login Request',
        'method' => 'POST',
        'url' => '{{host}}/api/auth/login',
        'headers' => [],
        'params' => [],
        'body' => '',
    ], $headers);

    // Update request
    $response = $this->request('PUT', '/api/collections/col-1/requests/req-1', [
        'name' => 'Updated Login Request',
        'method' => 'GET',
        'url' => '{{host}}/api/auth/profile',
        'headers' => [['key' => 'Accept', 'value' => 'application/json', 'enabled' => true]],
        'params' => [],
        'body' => '',
    ], $headers);

    expect($response->getStatusCode())->toBe(200);
    $body = json_decode((string) $response->getBody(), true);
    expect($body['name'])->toBe('Updated Login Request');
    expect($body['method'])->toBe('GET');
});

test('user can delete request template', function () {
    $headers = getAuthHeader($this);

    $this->request('POST', '/api/collections', ['id' => 'col-1', 'name' => 'Auth'], $headers);
    $this->request('POST', '/api/collections/col-1/requests', [
        'id' => 'req-1',
        'name' => 'Login',
        'method' => 'POST',
        'url' => '{{host}}/',
        'headers' => [],
        'params' => [],
        'body' => '',
    ], $headers);

    $response = $this->request('DELETE', '/api/collections/col-1/requests/req-1', [], $headers);
    expect($response->getStatusCode())->toBe(200);
});

test('user can delete collection', function () {
    $headers = getAuthHeader($this);

    $this->request('POST', '/api/collections', ['id' => 'col-1', 'name' => 'Auth'], $headers);

    $response = $this->request('DELETE', '/api/collections/col-1', [], $headers);
    expect($response->getStatusCode())->toBe(200);
});
