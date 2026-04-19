<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UhiController; 
use App\Http\Controllers\Api\HistoryController;


Route::get('/uhi-analysis', [UhiController::class, 'getAnalysis']);
Route::get('/history', [HistoryController::class, 'index']);
Route::post('/history', [HistoryController::class, 'store']);
Route::delete('/history/{id}', [HistoryController::class, 'destroy']);