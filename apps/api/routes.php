<?php

declare(strict_types=1);

use App\Auth\Controllers\AuthController;
use App\Auth\Middleware\AuthMiddleware;
use App\Collections\Controllers\CollectionController;
use App\Environments\Controllers\EnvironmentController;
use App\History\Controllers\HistoryController;
use App\OpenApi\Controllers\OpenApiController;
use Stout\Http\Router;

return function (Router $router) {
    $router->get('/', fn () => 'Hello World');
    $router->get('/api/openapi.json', [OpenApiController::class, 'generate']);
    
    // Auth routes
    $router->post('/api/auth/register', [AuthController::class, 'register']);
    $router->post('/api/auth/login', [AuthController::class, 'login']);
    $router->get('/api/auth/profile', [AuthController::class, 'profile'])->add(AuthMiddleware::class);

    // Collection / Request Template routes
    $router->get('/api/collections', [CollectionController::class, 'list'])->add(AuthMiddleware::class);
    $router->post('/api/collections', [CollectionController::class, 'createCollection'])->add(AuthMiddleware::class);
    $router->delete('/api/collections/{id}', [CollectionController::class, 'deleteCollection'])->add(AuthMiddleware::class);
    $router->post('/api/collections/{id}/requests', [CollectionController::class, 'addRequest'])->add(AuthMiddleware::class);
    $router->put('/api/collections/{collectionId}/requests/{requestId}', [CollectionController::class, 'updateRequest'])->add(AuthMiddleware::class);
    $router->delete('/api/collections/{collectionId}/requests/{requestId}', [CollectionController::class, 'deleteRequest'])->add(AuthMiddleware::class);

    // Environment routes
    $router->get('/api/environments', [EnvironmentController::class, 'list'])->add(AuthMiddleware::class);
    $router->post('/api/environments', [EnvironmentController::class, 'create'])->add(AuthMiddleware::class);
    $router->put('/api/environments/{id}', [EnvironmentController::class, 'update'])->add(AuthMiddleware::class);
    $router->delete('/api/environments/{id}', [EnvironmentController::class, 'delete'])->add(AuthMiddleware::class);

    // History routes
    $router->get('/api/history', [HistoryController::class, 'list'])->add(AuthMiddleware::class);
    $router->post('/api/history', [HistoryController::class, 'create'])->add(AuthMiddleware::class);
    $router->delete('/api/history', [HistoryController::class, 'clear'])->add(AuthMiddleware::class);
    $router->delete('/api/history/{id}', [HistoryController::class, 'delete'])->add(AuthMiddleware::class);

    // Proxy route
    $router->post('/api/proxy', function (\Stout\Http\Request $request, \Stout\Http\Response $response) {
        $url = $request->input('url', '');
        $method = $request->input('method', 'GET');
        $headers = $request->input('headers', []);
        $reqBody = $request->input('body', '');

        if (empty($url)) {
            return $response->json(['error' => 'url is required'], 400);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $curlHeaders = [];
        foreach ($headers as $name => $value) {
            $curlHeaders[] = "$name: $value";
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);

        if (!empty($reqBody) && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $reqBody);
        }

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $startTime = microtime(true);
        $result = curl_exec($ch);
        $endTime = microtime(true);
        $duration = (int)(($endTime - $startTime) * 1000);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return $response->json([
                'error' => 'Gateway Error',
                'details' => $error
            ], 502);
        }

        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resHeadersStr = substr($result, 0, $headerSize);
        $resBody = substr($result, $headerSize);

        $resHeaders = [];
        foreach (explode("\r\n", $resHeadersStr) as $line) {
            $parts = explode(":", $line, 2);
            if (count($parts) === 2) {
                $name = strtolower(trim($parts[0]));
                $value = trim($parts[1]);
                $resHeaders[$name] = $value;
            }
        }

        return $response->json([
            'status' => $status,
            'headers' => $resHeaders,
            'body' => $resBody,
            'time' => $duration,
            'size' => strlen($resBody)
        ]);
    });
};
