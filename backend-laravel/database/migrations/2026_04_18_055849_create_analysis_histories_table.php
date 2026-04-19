<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi untuk membuat tabel analysis_histories.
     */
    public function up(): void
    {
        Schema::create('analysis_histories', function (Blueprint $table) {
            $table->id();
            $table->string('location_name')->default('Lokasi Tanpa Nama');
            
            // Decimal 10,7 cocok untuk koordinat GPS agar presisi
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            
            $table->float('temperature_avg');
            $table->float('ndvi_avg');
            $table->date('date_start');
            $table->date('date_end');
            
            // Menggunakan JSON untuk menyimpan data grafik time series
            $table->json('history_data')->nullable(); 
            
            $table->timestamps();
        });
    }

    /**
     * Batalkan migrasi (Rollback).
     */
    public function down(): void
    {
        Schema::dropIfExists('analysis_histories');
    }
};