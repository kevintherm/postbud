final <?php

declare(strict_types=1);

namespace App\User\Exceptions;

use Exception;

class ForbiddenException extends Exception
{
    public function __construct(string $message = 'Forbidden', int $code = 403)
    {
        parent::__construct($message, $code);
    }
}
