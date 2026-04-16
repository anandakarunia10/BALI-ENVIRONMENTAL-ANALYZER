from flask import Flask, request, jsonify
from flask_cors import CORS
import analyzer

app = Flask(__name__)
CORS(app)

analyzer.initialize_ee()

@app.route('/analyze', methods=['GET'])
def analyze_uhi():
    try:
        lat = float(request.args.get('lat', -8.11))
        lng = float(request.args.get('lng', 115.09))
        radius = float(request.args.get('radius', 5))
        date_start = request.args.get('date_start', '2025-01-01')
        date_end = request.args.get('date_end', '2025-03-01')
        
        result = analyzer.get_uhi_data(lat, lng, radius, date_start, date_end)
        return jsonify({"status": "success", "results": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)