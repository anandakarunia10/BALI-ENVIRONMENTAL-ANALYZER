<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UhiController; // <-- Jangan sampai ketinggalan!

// Daftarkan route kamu di sini
Route::get('/uhi-analysis', [UhiController::class, 'getAnalysis']);