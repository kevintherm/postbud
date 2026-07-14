<?php

declare(strict_types=1);

function getAuthHeaderHist($testCase, string $email = 'histuser@example.com'): array
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

test('guest cannot access history', function () {
    $response = $this->request('GET', '/api/history');
    expect($response->getStatusCode())->toBe(401);
});

test('user can create history entry successfully', function () {
    $headers = getAuthHeaderHist($this);
    
    $response = $this->request('POST', '/api/history', [
        'id' => 'hist-1',
        'url' => 'https://api.github.com/users/octocat',
        'method' => 'GET',
        'status' => 200,
        'time' => 245,
        'size' => 1024,
        'timestamp' => 1625097600
    ], $headers);

    expect($response->getStatusCode())->toBe(201);
    
    $body = json_decode((string) $response->getBody(), true);
    expect($body['id'])->toBe('hist-1');
    expect($body['url'])->toBe('https://api.github.com/users/octocat');
    expect($body['status'])->toBe(200);
});

test('user can fetch their history', function () {
    $headers = getAuthHeaderHist($this);

    // Create history entry
    $this->request('POST', '/api/history', [
        'id' => 'hist-1',
        'url' => 'https://api.github.com/users/octocat',
        'method' => 'GET',
        'status' => 200,
        'time' => 245,
        'size' => 1024,
        'timestamp' => 1625097600
    ], $headers);

    $response = $this->request('GET', '/api/history', [], $headers);
    expect($response->getStatusCode())->toBe(200);
    
    $body = json_decode((string) $response->getBody(), true);
    expect(count($body))->toBe(1);
    expect($body[0]['url'])->toBe('https://api.github.com/users/octocat');
});

test('user can delete history entry', function () {
    $headers = getAuthHeaderHist($this);

    $this->request('POST', '/api/history', [
        'id' => 'hist-1',
        'url' => 'https://api.github.com/users/octocat',
        'method' => 'GET',
        'status' => 200,
        'time' => 245,
        'size' => 1024,
        'timestamp' => 1625097600
    ], $headers);

    $response = $this->request('DELETE', '/api/history/hist-1', [], $headers);
    expect($response->getStatusCode())->toBe(200);
});

test('user can clear all history', function () {
    $headers = getAuthHeaderHist($this);

    // Create two entries
    $this->request('POST', '/api/history', [
        'id' => 'hist-1',
        'url' => 'https://api.github.com/1',
        'method' => 'GET',
        'status' => 200,
        'time' => 100,
        'size' => 500,
        'timestamp' => 1625097600
    ], $headers);

    $this->request('POST', '/api/history', [
        'id' => 'hist-2',
        'url' => 'https://api.github.com/2',
        'method' => 'GET',
        'status' => 200,
        'time' => 150,
        'size' => 600,
        'timestamp' => 1625097601
    ], $headers);

    $response = $this->request('DELETE', '/api/history', [], $headers);
    expect($response->getStatusCode())->toBe(200);

    // Fetch and check empty
    $fetchRes = $this->request('GET', '/api/history', [], $headers);
    $fetchBody = json_decode((string) $fetchRes->getBody(), true);
    expect(count($fetchBody))->toBe(0);
});
