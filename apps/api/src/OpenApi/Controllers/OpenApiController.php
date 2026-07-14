<?php

declare(strict_types=1);

namespace App\OpenApi\Controllers;

use OpenApi\Attributes as OA;
use OpenApi\Generator;
use Stout\Http\Request;
use Stout\Http\Response;

#[OA\Info(title: "Postbud API", version: "1.0.0", description: "Portable PWA API Client Backend")]
#[OA\Server(url: "http://localhost:8000")]
final class OpenApiController
{
    /**
     * @psalm-suppress PossiblyUnusedMethod
     * @psalm-suppress UnusedParam
     */
    #[OA\Get(
        path: "/api/openapi.json",
        summary: "Get OpenAPI specification",
        responses: [
            new OA\Response(
                response: 200,
                description: "OpenAPI JSON Specification",
                content: new OA\JsonContent(type: "object")
            )
        ]
    )]
    public function generate(Request $request, Response $response): Response
    {
        // Scan the src directory for OpenAPI annotations/attributes
        $openapi = (new Generator())->generate([dirname(__DIR__, 2)]);

        // Decode and output as JSON
        $data = [];
        if ($openapi !== null) {
            $decoded = json_decode($openapi->toJson(), true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        return $response->json($data);
    }
}
