from flask import Flask
from flask_cors import CORS

from routes.auth_routes import auth
from routes.docentes_routes import docentes
from routes.materias_routes import materias
from routes.horarios_routes import horarios_bp  # Importa el nuevo blueprint

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta_aquí'

# Permite solicitudes desde React (http://localhost:3000) y envío de cookies
CORS(app,
     supports_credentials=True,
     resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Registrar Blueprints bajo /api
app.register_blueprint(auth, url_prefix='/api')
app.register_blueprint(docentes, url_prefix='/api')
app.register_blueprint(materias, url_prefix='/api')
app.register_blueprint(horarios_bp, url_prefix='/api')  # Registra el blueprint de horarios


import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
