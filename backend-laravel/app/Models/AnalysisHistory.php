<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalysisHistory extends Model
{
    use HasFactory;

    // Ini hukumnya WAJIB agar data dari Frontend bisa masuk ke database
    protected $fillable = [
        'location_name', 
        'latitude', 
        'longitude', 
        'temperature_avg', 
        'ndvi_avg', 
        'date_start', 
        'date_end', 
        'history_data'
    ];

    /**
     * Casts: Beritahu Laravel bahwa 'history_data' adalah JSON
     * sehingga otomatis diubah jadi Array saat kita panggil di Next.js
     */
    protected $casts = [
        'history_data' => 'array',
        'date_start'   => 'date',
        'date_end'     => 'date',
    ];
}