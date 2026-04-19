import ee
import os

def initialize_ee():
    """Inisialisasi koneksi ke Google Earth Engine menggunakan Service Account"""
    try:
        # Mengambil path credentials.json secara dinamis
        relative_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
        email_service_account = 'uhi-analyzer@workshop-489403.iam.gserviceaccount.com' 
        
        credentials = ee.ServiceAccountCredentials(email_service_account, relative_path)
        ee.Initialize(credentials)
        print("✅ Success: Earth Engine terhubung!")
        return True
    except Exception as e:
        print(f"❌ Error Inisialisasi: {e}")
        return False

def get_uhi_data(lat, lng, radius, date_start, date_end):
    """Menghitung LST, NDVI, dan menghasilkan deret waktu (history) untuk prediksi"""
    try:
        # 1. Definisikan Area Kerja (Buffer berdasarkan KM)
        point = ee.Geometry.Point([lng, lat])
        region = point.buffer(radius * 1000).bounds()

        # 2. Ambil Koleksi Citra Landsat 8
        collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2") \
            .filterBounds(region) \
            .filterDate(date_start, date_end) \
            .sort('CLOUD_COVER')

        # --- FUNGSI INTERNAL UNTUK MEMBUAT DERET WAKTU (HISTORY) ---
        def calculate_temp_series(img):
            # Rumus LST Landsat 8 C2 L2: (DN * 0.00341802 + 149) - 273.15
            temp_img = img.select('ST_B10').multiply(0.00341802).add(149).subtract(273.15)
            
            # Masking: Hanya ambil suhu > 10 C (Buang anomali awan yang bikin minus)
            valid_temp = temp_img.updateMask(temp_img.gt(10))
            
            mean_temp = valid_temp.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region,
                scale=30,
                maxPixels=1e9
            ).get('ST_B10')
            
            return ee.Feature(None, {
                'date': img.date().format('YYYY-MM-dd'),
                'temp': mean_temp # Key 'temp' ini akan dibaca oleh Linear Regression di Flask
            })

        # Ambil maksimal 10 data untuk dihitung regresinya
        history_data = collection.limit(10).map(calculate_temp_series).getInfo()
        
        # Bersihkan data: Hapus yang nilainya None
        history_list = [f['properties'] for f in history_data['features'] if f['properties'].get('temp') is not None]

        # --- PROSES CITRA UTAMA (VISUALISASI) ---
        image = collection.first()

        if image.getInfo() is None:
            raise Exception("Citra tidak ditemukan atau terlalu berawan. Coba perlebar rentang tanggal.")

        # Hitung LST Utama
        thermal_band = image.select('ST_B10')
        lst_raw = thermal_band.multiply(0.00341802).add(149).subtract(273.15)
        
        # Masking untuk visualisasi (Membuang noise)
        lst_final = lst_raw.updateMask(lst_raw.gt(10)).clip(region)

        stats_lst = lst_final.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        ).getInfo()

        avg_temp = stats_lst.get('ST_B10')
        avg_temp = round(avg_temp, 2) if avg_temp is not None else 0

        # Hitung NDVI (Vegetasi)
        ndvi_image = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
        ndvi_final = ndvi_image.updateMask(ndvi_image.gt(-1)).clip(region)

        stats_ndvi = ndvi_final.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        ).getInfo()

        avg_ndvi = stats_ndvi.get('NDVI')
        avg_ndvi = round(avg_ndvi, 2) if avg_ndvi is not None else 0

        # Konfigurasi Peta (Visual)
        vis_params = {
            'min': 20, 
            'max': 45, 
            'palette': ['0000FF', '00FF00', 'FFFF00', 'FF0000']
        }
        
        map_id = lst_final.getMapId(vis_params)
        raw_date = image.date().format('YYYY-MM-dd').getInfo()
        raw_cloud = image.get('CLOUD_COVER').getInfo()
        
        return {
            "average_temp_celsius": avg_temp,
            "average_ndvi": avg_ndvi,
            "tile_url": map_id['tile_fetcher'].url_format,
            "acquisition_date": raw_date,
            "cloud_cover": f"{round(raw_cloud, 2)}%",
            "history": history_list # Data ini yang dikirim ke Flask untuk Regresi
        }

    except Exception as e:
        raise Exception(f"GEE Error: {str(e)}")