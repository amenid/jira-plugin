from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permet au frontend d'accéder au backend

@app.route('/message', methods=['GET'])
def get_message():
    return jsonify({"message": "Hello depuis Flask 🚀"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
