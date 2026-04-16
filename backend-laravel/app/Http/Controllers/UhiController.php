<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UhiController extends Controller
{
    public function getAnalysis(Request $request)
    {
        $pythonUrl = 'http://127.0.0.1:5000/analyze';
        try {
            $response = Http::get($pythonUrl, [
                'lat'        => $request->query('lat'),
                'lng'        => $request->query('lng'),
                'radius'     => $request->query('radius', 5),
                'date_start' => $request->query('date_start'),
                'date_end'   => $request->query('date_end'),
            ]);
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}