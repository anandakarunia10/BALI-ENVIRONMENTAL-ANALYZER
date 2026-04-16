<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // bisa diganti 'http://localhost:3000' kalau mau spesifik
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];