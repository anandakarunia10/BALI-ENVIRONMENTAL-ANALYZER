import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from flask import Flask, request, jsonify
from flask_cors import CORS
import analyzer

app = Flask(__name__)
# Mengaktifkan CORS agar dapat diakses oleh Next.js
CORS(app)

# Inisialisasi Google Earth Engine
analyzer.initialize_ee()

# --- ENDPOINT 1: ANALISIS GEE ---
@app.route('/analyze', methods=['GET'])
def analyze_uhi():
    try:
        lat = float(request.args.get('lat', -8.11))
        lng = float(request.args.get('lng', 115.09))
        radius = float(request.args.get('radius', 5))
        date_start = request.args.get('date_start', '2025-01-01')
        date_end = request.args.get('date_end', '2025-03-01')
        
        # Mengambil data dari script analyzer (Google Earth Engine)
        result = analyzer.get_uhi_data(lat, lng, radius, date_start, date_end)
        return jsonify({"status": "success", "results": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- ENDPOINT 2: PREDIKSI UHI (TIME-SERIES LINEAR REGRESSION) ---
@app.route('/api/predict-uhi', methods=['POST'])
def predict_uhi():
    try:
        # Mengambil data deret waktu yang dikirim langsung dari Frontend hasil GEE
        incoming_data = request.json.get('history_data', [])
        
        # Validasi minimal data untuk regresi
        if len(incoming_data) < 3:
            return jsonify({
                "status": "error", 
                "message": "Data tidak cukup. Butuh minimal 3 titik waktu untuk prediksi tren."
            }), 400

        # Preprocessing menggunakan pandas
        df = pd.DataFrame(incoming_data)
        
        # Membuat index angka sebagai sumbu X (Waktu: 0, 1, 2...)
        df['index'] = np.arange(len(df))
        
        # Menentukan sumbu X (Waktu) dan y (Suhu/Temp)
        # Catatan: Pastikan key di 'result.results.history' dari GEE adalah 'temp'
        X = df[['index']].values
        y = df['temp'].values

        # Inisialisasi Model Linear Regression
        model = LinearRegression()
        model.fit(X, y)

        # Prediksi 1 langkah (bulan/periode) ke depan
        next_index = len(df)
        prediction = model.predict([[next_index]])[0]

        # Mengembalikan hasil kalkulasi statistik ke Frontend
        return jsonify({
            "status": "success",
            "predicted_next": round(float(prediction), 2),
            "trend": "naik" if model.coef_[0] > 0 else "turun",
            "coefficient": float(model.coef_[0])
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Menjalankan server
if __name__ == '__main__':
    # Port 5000 adalah default Flask
    app.run(host='0.0.0.0', port=5000, debug=True)