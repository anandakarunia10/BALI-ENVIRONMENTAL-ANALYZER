<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalysisHistory;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    // Ambil semua data
    public function index() {
        return response()->json(AnalysisHistory::latest()->get());
    }

    // Simpan data baru
    public function store(Request $request) {
        $history = AnalysisHistory::create($request->all());
        return response()->json(['status' => 'success', 'data' => $history]);
    }

    // Hapus data
    public function destroy($id) {
        AnalysisHistory::destroy($id);
        return response()->json(['status' => 'deleted']);
    }
}