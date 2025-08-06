from flask import Blueprint, request, jsonify, session
from utils.db import get_connection

auth = Blueprint('auth', __name__)

@auth.route('/auth/login', methods=['POST'])
def login():
    data       = request.json
    usuario    = data.get('usuario')
    contrasena = data.get('contrasena')

    conn = get_connection()
    cur  = conn.cursor()
    # NUEVA consulta: selecciona de users
    cur.execute(
        "SELECT password, role FROM users WHERE username = %s",
        (usuario,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or row[0] != contrasena:
        return jsonify({'error': 'Credenciales inválidas'}), 401

    session['usuario'] = usuario
    session['role']    = row[1]
    return jsonify({'message': 'Login exitoso', 'role': row[1]}), 200
