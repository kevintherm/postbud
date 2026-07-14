<?php

declare(strict_types=1);

namespace App\Environments\Controllers;

use App\Environments\Models\Environment;
use App\User\Models\User;
use Doctrine\ORM\EntityManagerInterface;
use Stout\Http\Request;
use Stout\Http\Response;

class EnvironmentController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function list(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');

        $environments = $this->entityManager->getRepository(Environment::class)
            ->findBy(['user' => $user]);

        $data = [];
        foreach ($environments as $env) {
            $data[] = [
                'id' => $env->getId(),
                'name' => $env->getName(),
                'variables' => $env->getVariables(),
            ];
        }

        return $response->json($data);
    }

    public function create(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->json('id', '');
        $name = $request->json('name', '');
        $variables = $request->json('variables', []);

        if (empty($id) || empty($name)) {
            return $response->json(['error' => 'id and name are required'], 400);
        }

        $env = new Environment();
        $env->setId($id);
        $env->setName($name);
        $env->setVariables($variables);
        $env->setUser($user);

        try {
            $this->entityManager->persist($env);
            $this->entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
            return $response->json(['error' => 'Environment already exists'], 409);
        }

        return $response->json([
            'id' => $env->getId(),
            'name' => $env->getName(),
            'variables' => $env->getVariables(),
        ], 201);
    }

    public function update(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->getAttribute('id', '');

        /** @var Environment|null $env */
        $env = $this->entityManager->getRepository(Environment::class)
            ->findOneBy(['id' => $id, 'user' => $user]);

        if ($env === null) {
            return $response->json(['error' => 'Environment not found'], 404);
        }

        $name = $request->json('name', $env->getName());
        $variables = $request->json('variables', $env->getVariables());

        $env->setName($name);
        $env->setVariables($variables);

        $this->entityManager->flush();

        return $response->json([
            'id' => $env->getId(),
            'name' => $env->getName(),
            'variables' => $env->getVariables(),
        ]);
    }

    public function delete(Request $request, Response $response): Response
    {
        /** @var User $user */
        $user = $request->getAttribute('user');
        $id = $request->getAttribute('id', '');

        $env = $this->entityManager->getRepository(Environment::class)
            ->findOneBy(['id' => $id, 'user' => $user]);

        if ($env === null) {
            return $response->json(['error' => 'Environment not found'], 404);
        }

        $this->entityManager->remove($env);
        $this->entityManager->flush();

        return $response->json(['status' => 'success']);
    }
}
