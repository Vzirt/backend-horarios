from flask import Blueprint, request, jsonify
from utils.db import get_connection

# Nombre del blueprint: 'materias'
materias = Blueprint('materias', __name__)

@materias.route('/materias', methods=['GET'])
def get_materias():
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT id, carrera, materia, grupo FROM materias")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([
        {'id': r[0], 'carrera': r[1], 'materia': r[2], 'grupo': r[3]}
        for r in rows
    ]), 200

@materias.route('/materias', methods=['POST'])
def add_materia():
    data = request.json
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO materias (carrera, materia, grupo)
        VALUES (%s, %s, %s)
    """, (data['carrera'], data['materia'], data['grupo']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Materia agregada'}), 201

@materias.route('/materias/<int:id>', methods=['PUT'])
def update_materia(id):
    data = request.json
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE materias
        SET carrera=%s, materia=%s, grupo=%s
        WHERE id=%s
    """, (data['carrera'], data['materia'], data['grupo'], id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Materia actualizada'}), 200

@materias.route('/materias/<int:id>', methods=['DELETE'])
def delete_materia(id):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("DELETE FROM materias WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Materia eliminada'}), 200
