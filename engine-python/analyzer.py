import ee
import os

def initialize_ee():
    """Inisialisasi koneksi ke Google Earth Engine menggunakan Service Account"""
    try:
        
        relative_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
        
        email_service_account = 'uhi-analyzer@workshop-489403.iam.gserviceaccount.com' 
        
        # Proses autentikasi
        credentials = ee.ServiceAccountCredentials(email_service_account, relative_path)
        ee.Initialize(credentials)
        print("✅ Success: Earth Engine terhubung!")
        return True
    except Exception as e:
        print(f"❌ Error Inisialisasi: {e}")
        return False

def get_uhi_data(lat, lng, radius, date_start, date_end):
    """Membuat poligon otomatis, menghitung LST (Suhu) dan NDVI (Vegetasi)"""
    try:
       
        point = ee.Geometry.Point([lng, lat])
        region = point.buffer(radius * 1000).bounds()

        
        collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2") \
            .filterBounds(region) \
            .filterDate(date_start, date_end) \
            .sort('CLOUD_COVER')

        
        image = collection.first()

        
        if image.getInfo() is None:
            raise Exception("Citra satelit tidak ditemukan atau terlalu berawan. Silakan perlebar rentang tanggal.")

        
        thermal_band = image.select('ST_B10')
       
        lst_full = thermal_band.multiply(0.00341802).add(149).subtract(273.15)
        lst_clipped = lst_full.clip(region)

        
        stats_lst = lst_clipped.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        ).getInfo()

        avg_temp = stats_lst.get('ST_B10')
        avg_temp = round(avg_temp, 2) if avg_temp is not None else 0

        # --- 4. ANALISIS VEGETASI (NDVI) ---
        # NDVI = (NIR - RED) / (NIR + RED)
        # Landsat 8: NIR = B5, RED = B4
        ndvi_image = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
        ndvi_clipped = ndvi_image.clip(region)

       
        stats_ndvi = ndvi_clipped.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        ).getInfo()

        avg_ndvi = stats_ndvi.get('NDVI')
        avg_ndvi = round(avg_ndvi, 2) if avg_ndvi is not None else 0

       
        vis_params = {
            'min': 25, 
            'max': 45, 
            'palette': ['0000FF', '00FF00', 'FFFF00', 'FF0000']
        }
        
        map_id = lst_clipped.getMapId(vis_params)
      
        raw_date = image.date().format('YYYY-MM-dd').getInfo()
        raw_cloud = image.get('CLOUD_COVER').getInfo()
        
        return {
            "average_temp_celsius": avg_temp,
            "average_ndvi": avg_ndvi, # Data tambahan untuk tema vegetasi
            "tile_url": map_id['tile_fetcher'].url_format,
            "acquisition_date": raw_date,
            "cloud_cover": f"{round(raw_cloud, 2)}%"
        }

    except Exception as e:
        raise Exception(str(e))