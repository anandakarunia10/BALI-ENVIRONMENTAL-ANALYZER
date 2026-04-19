<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validasi input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        // 3. Cek apakah user ada dan password cocok
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau Password salah, Bray!'
            ], 401);
        }

        // 4. Hapus token lama & buat token baru (Sanctum)
        $user->tokens()->delete();
        $token = $user->createToken('bali-env-token')->plainTextToken;

        // 5. Kirim respon balik ke Next.js
        return response()->json([
            'status' => 'success',
            'access_token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email
            ]
        ], 200);
    }
}