<?php

declare(strict_types=1);

test('guest can register successfully', function () {
    $response = $this->request('POST', '/api/auth/register', [
        'email' => 'test@example.com',
        'password' => 'securepassword123',
    ]);

    expect($response->getStatusCode())->toBe(201);
    
    $body = json_decode((string) $response->getBody(), true);
    expect($body)->toHaveKey('user');
    expect($body['user']['email'])->toBe('test@example.com');
    expect($body['user'])->not->toHaveKey('password');
});

test('registration validates inputs', function () {
    $response = $this->request('POST', '/api/auth/register', [
        'email' => 'invalid-email',
        'password' => '123', // too short
    ]);

    expect($response->getStatusCode())->toBe(400);
});

test('registration rejects duplicate emails', function () {
    // First registration
    $this->request('POST', '/api/auth/register', [
        'email' => 'dup@example.com',
        'password' => 'password123',
    ]);

    // Second registration
    $response = $this->request('POST', '/api/auth/register', [
        'email' => 'dup@example.com',
        'password' => 'password123',
    ]);

    expect($response->getStatusCode())->toBe(400);
    $body = json_decode((string) $response->getBody(), true);
    expect($body['error'])->toContain('email already exists');
});

test('user can login successfully', function () {
    // Register first
    $this->request('POST', '/api/auth/register', [
        'email' => 'login@example.com',
        'password' => 'password123',
    ]);

    // Attempt login
    $response = $this->request('POST', '/api/auth/login', [
        'email' => 'login@example.com',
        'password' => 'password123',
    ]);

    expect($response->getStatusCode())->toBe(200);
    $body = json_decode((string) $response->getBody(), true);
    expect($body)->toHaveKey('token');
    expect($body['token'])->toBeString();
});

test('login rejects bad credentials', function () {
    $response = $this->request('POST', '/api/auth/login', [
        'email' => 'wrong@example.com',
        'password' => 'wrongpass',
    ]);

    expect($response->getStatusCode())->toBe(401);
});

test('user can fetch profile with valid token', function () {
    // Register
    $this->request('POST', '/api/auth/register', [
        'email' => 'profile@example.com',
        'password' => 'password123',
    ]);

    // Login to get token
    $loginRes = $this->request('POST', '/api/auth/login', [
        'email' => 'profile@example.com',
        'password' => 'password123',
    ]);
    $loginBody = json_decode((string) $loginRes->getBody(), true);
    $token = $loginBody['token'];

    // Request profile
    $profileRes = $this->request('GET', '/api/auth/profile', [], [
        'Authorization' => "Bearer $token"
    ]);

    expect($profileRes->getStatusCode())->toBe(200);
    $profileBody = json_decode((string) $profileRes->getBody(), true);
    expect($profileBody['email'])->toBe('profile@example.com');
});

test('profile requests fail without valid token', function () {
    $response = $this->request('GET', '/api/auth/profile', [], [
        'Authorization' => 'Bearer invalid-token'
    ]);

    expect($response->getStatusCode())->toBe(401);
});
