from flask import Blueprint, jsonify, request
from config import DB_CONFIG
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import google.generativeai as genai
from flask_cors import cross_origin

# Configura Gemini
genai.configure(api_key="AIzaSyBfZERjs1Xx9STbLiU5j8rqNAQend6zcTg")

# Usa modelo correcto
modelo = genai.GenerativeModel('models/gemini-2.5-pro')

horarios_bp = Blueprint('horarios_bp', __name__)

@horarios_bp.route('/prueba', methods=['GET'])
def prueba():
    return jsonify({"mensaje": "Rutas de horarios funcionando"})

@horarios_bp.route('/sugerencia-horario', methods=['POST', 'OPTIONS'])
@cross_origin()
def sugerencia_horario():
    data = request.json
    carrera = data.get('carrera')
    cuatrimestre = data.get('cuatrimestre')
    grupo = data.get('grupo')
    materias = data.get('materias')

    prompt = f"Sugiere un horario académico para la carrera {carrera}, cuatrimestre {cuatrimestre}, grupo {grupo}, con estas materias y docentes:\n"
    for m in materias:
        prompt += f"- {m['materia']} (Docente: {m['docente']})\n"
    prompt += "\nOrganiza las materias de lunes a viernes entre las 12:30 y 19:20, sin empalmes ni recesos repetidos. Devuelve solo el horario sugerido en texto, sin explicaciones."

    try:
        response = modelo.generate_content(prompt)
        return jsonify({'sugerencia': response.text})
    except Exception as e:
        print("Error con Gemini:", e)
        return jsonify({'error': 'No se pudo generar sugerencia con Gemini'}), 500




def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

@horarios_bp.route('/grupos', methods=['GET'])
def get_grupos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id, nombre FROM grupos ORDER BY nombre")
        grupos = cur.fetchall()
        return jsonify(grupos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/carreras', methods=['GET'])
def get_carreras():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id, nombre FROM carreras ORDER BY nombre")
        carreras = cur.fetchall()
        return jsonify(carreras)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/asesores', methods=['GET'])
def get_asesores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id, nombre FROM asesores ORDER BY nombre")
        asesores = cur.fetchall()
        return jsonify(asesores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/asignaciones', methods=['GET'])
def get_asignaciones():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
        SELECT a.id, h.dia, h.hora_inicio, h.hora_fin, h.aula,
               m.materia, m.carrera, d.nombre as docente,
               g.nombre as grupo, a.cuatrimestre, c.nombre as carrera_nombre,
               ase.nombre as asesor
        FROM asignaciones a
        JOIN horarios h ON a.horario_id = h.id
        JOIN materias m ON a.materia_id = m.id
        JOIN docentes d ON a.docente_id = d.id
        JOIN grupos g ON a.grupo_id = g.id
        JOIN carreras c ON a.carrera_id = c.id
        LEFT JOIN asesores ase ON a.asesor_id = ase.id
        ORDER BY h.dia, h.hora_inicio
        """
        cur.execute(query)
        asignaciones = cur.fetchall()
        return jsonify(asignaciones)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/materias-con-docentes', methods=['GET'])
def get_materias_con_docentes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
        SELECT m.id, m.carrera, m.materia, m.grupo, 
               d.id as docente_id, d.nombre as docente_nombre, d.usuario
        FROM materias m
        LEFT JOIN docentes d ON m.id = d.materia_id
        WHERE d.id IS NOT NULL
        ORDER BY m.carrera, m.grupo
        """
        cur.execute(query)
        materias = cur.fetchall()
        return jsonify(materias)
    except Exception as e:
        print("Error en materias-con-docentes:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/horarios/disponibles', methods=['GET'])
def get_horarios_disponibles():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
        SELECT h.* FROM horarios h
        LEFT JOIN asignaciones a ON h.id = a.horario_id
        WHERE a.id IS NULL
        ORDER BY h.dia, h.hora_inicio
        """
        cur.execute(query)
        horarios = cur.fetchall()
        
        for horario in horarios:
            horario['hora_inicio'] = str(horario['hora_inicio'])
            horario['hora_fin'] = str(horario['hora_fin'])
            
        return jsonify(horarios)
    except Exception as e:
        print("Error en horarios/disponibles:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/asignaciones', methods=['POST'])
def crear_asignacion():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    
    required_fields = ['docente_id', 'materia_id', 'horario_id', 'grupo_id', 'cuatrimestre', 'carrera_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    try:
        cur.execute("SELECT dia, hora_inicio, hora_fin FROM horarios WHERE id = %s", 
                   (data['horario_id'],))
        horario = cur.fetchone()
        
        conflict_check = """
        SELECT 1 FROM asignaciones a
        JOIN horarios h ON a.horario_id = h.id
        WHERE a.docente_id = %s AND h.dia = %s AND (
          (h.hora_inicio <= %s AND h.hora_fin > %s) OR
          (h.hora_inicio < %s AND h.hora_fin >= %s) OR
          (h.hora_inicio >= %s AND h.hora_fin <= %s)
        )
        """
        
        cur.execute(conflict_check, (
            data['docente_id'], horario['dia'], 
            horario['hora_inicio'], horario['hora_inicio'],
            horario['hora_fin'], horario['hora_fin'],
            horario['hora_inicio'], horario['hora_fin']
        ))
        
        if cur.fetchone():
            return jsonify({'error': 'El docente ya tiene un horario asignado en ese rango horario'}), 400
        
        grupo_conflict = """
        SELECT 1 FROM asignaciones a
        JOIN horarios h ON a.horario_id = h.id
        WHERE a.grupo_id = %s AND h.dia = %s AND (
          (h.hora_inicio <= %s AND h.hora_fin > %s) OR
          (h.hora_inicio < %s AND h.hora_fin >= %s) OR
          (h.hora_inicio >= %s AND h.hora_fin <= %s)
        )
        """
        
        cur.execute(grupo_conflict, (
            data['grupo_id'], horario['dia'],
            horario['hora_inicio'], horario['hora_inicio'],
            horario['hora_fin'], horario['hora_fin'],
            horario['hora_inicio'], horario['hora_fin']
        ))
        
        if cur.fetchone():
            return jsonify({'error': 'El grupo ya tiene una asignación en ese rango horario'}), 400
        
        cur.execute(
            """INSERT INTO asignaciones 
               (docente_id, materia_id, horario_id, grupo_id, cuatrimestre, carrera_id, asesor_id) 
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (data['docente_id'], data['materia_id'], data['horario_id'], 
             data['grupo_id'], data['cuatrimestre'], data['carrera_id'],
             data.get('asesor_id'))
        )
        asignacion_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'success': True,
            'asignacion_id': asignacion_id,
            'message': 'Horario asignado correctamente'
        }), 201
        
    except Exception as e:
        conn.rollback()
        print("Error en crear_asignacion:", e)
        return jsonify({'error': str(e)}), 400
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/asignaciones/masivo', methods=['POST'])
def asignar_horarios_masivos():
    data = request.get_json()
    asignaciones = data.get('asignaciones', [])

    if not asignaciones:
        return jsonify({'error': 'No se recibieron asignaciones'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    asignaciones_insertadas = 0

    try:
        for asignacion in asignaciones:
            required_fields = ['docente_id', 'materia_id', 'dia', 'hora', 'aula',
                               'grupo_id', 'cuatrimestre', 'carrera_id']
            if not all(field in asignacion for field in required_fields):
                continue

            docente_id = asignacion['docente_id']
            materia_id = asignacion['materia_id']
            dia = asignacion['dia']
            hora = asignacion['hora']
            aula = asignacion['aula']
            grupo_id = asignacion['grupo_id']
            cuatrimestre = asignacion['cuatrimestre']
            carrera_id = asignacion['carrera_id']
            asesor_id = asignacion.get('asesor_id')

            hora_inicio, hora_fin = hora.split("-")
            hora_inicio = hora_inicio.strip()
            hora_fin = hora_fin.strip()

            # Verificar si ya existe ese horario con esa aula
            cur.execute("""
                SELECT id FROM horarios 
                WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s AND aula = %s
            """, (dia, hora_inicio, hora_fin, aula))
            result = cur.fetchone()

            if result:
                horario_id = result[0]
            else:
                cur.execute("""
                    INSERT INTO horarios (dia, hora_inicio, hora_fin, aula)
                    VALUES (%s, %s, %s, %s) RETURNING id
                """, (dia, hora_inicio, hora_fin, aula))
                horario_id = cur.fetchone()[0]

            # Verificar conflictos con docente
            cur.execute("""
                SELECT 1 FROM asignaciones 
                WHERE docente_id = %s AND horario_id = %s
            """, (docente_id, horario_id))
            if cur.fetchone():
                continue

            # Verificar conflictos con grupo
            cur.execute("""
                SELECT 1 FROM asignaciones 
                WHERE grupo_id = %s AND horario_id = %s
            """, (grupo_id, horario_id))
            if cur.fetchone():
                continue

            # Verificar conflictos con materia
            cur.execute("""
                SELECT 1 FROM asignaciones 
                WHERE materia_id = %s AND horario_id = %s
            """, (materia_id, horario_id))
            if cur.fetchone():
                continue

            # Insertar la asignación si todo está bien
            cur.execute("""
                INSERT INTO asignaciones 
                (docente_id, materia_id, horario_id, grupo_id, cuatrimestre, carrera_id, asesor_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (docente_id, materia_id, horario_id, grupo_id, cuatrimestre, carrera_id, asesor_id))
            asignaciones_insertadas += 1

        conn.commit()
        return jsonify({
            'success': True,
            'message': f'{asignaciones_insertadas} asignaciones insertadas correctamente.'
        }), 201

    except Exception as e:
        conn.rollback()
        print("Error en asignaciones masivas:", e)
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/horarios', methods=['GET'])
def obtener_horarios():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT h.id, h.dia, CONCAT(h.hora_inicio, '-', h.hora_fin) AS hora,
               h.aula, m.materia, d.nombre AS docente, g.nombre AS grupo,
               a.cuatrimestre, c.nombre AS carrera
        FROM asignaciones a
        JOIN horarios h ON a.horario_id = h.id
        JOIN materias m ON a.materia_id = m.id
        JOIN docentes d ON a.docente_id = d.id
        JOIN grupos g ON a.grupo_id = g.id
        JOIN carreras c ON a.carrera_id = c.id
    """)
    
    filas = cursor.fetchall()
    resultado = []
    for fila in filas:
        resultado.append({
            "id": fila[0],
            "dia": fila[1],
            "hora": fila[2],
            "aula": fila[3],
            "materia": fila[4],
            "docente": fila[5],
            "grupo": fila[6],
            "cuatrimestre": fila[7],
            "carrera": fila[8]
        })

    conn.close()
    return jsonify(resultado)

@horarios_bp.route('/asignaciones/historial-completo', methods=['GET'])
def obtener_historial_horarios():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        query = """
        SELECT h.dia, 
               CONCAT(TO_CHAR(h.hora_inicio, 'HH24:MI'), '-', TO_CHAR(h.hora_fin, 'HH24:MI')) AS hora,
               h.aula, m.materia, d.nombre AS docente,
               g.nombre AS grupo, a.cuatrimestre, c.nombre AS carrera
        FROM asignaciones a
        JOIN horarios h ON a.horario_id = h.id
        JOIN materias m ON a.materia_id = m.id
        JOIN docentes d ON a.docente_id = d.id
        JOIN grupos g ON a.grupo_id = g.id
        JOIN carreras c ON a.carrera_id = c.id
        ORDER BY h.dia, h.hora_inicio
        """

        cur.execute(query)
        resultados = cur.fetchall()
        return jsonify(resultados)

    except Exception as e:
        print("Error en historial-completo:", e)  # Agregado para ayudarte en consola
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()




@horarios_bp.route('/asignaciones/horario-filtrado', methods=['GET']) # Filtrado de busqueda
def obtener_horario_filtrado():
    carrera_id = request.args.get('carrera_id')
    cuatrimestre = request.args.get('cuatrimestre')
    grupo_id = request.args.get('grupo_id')

    if not carrera_id or not cuatrimestre or not grupo_id:
        return jsonify({'error': 'Faltan parámetros requeridos'}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        query = """
            SELECT h.dia, 
                   CONCAT(TO_CHAR(h.hora_inicio, 'HH24:MI'), '-', TO_CHAR(h.hora_fin, 'HH24:MI')) AS hora,
                   h.aula, m.materia, d.nombre AS docente,
                   g.nombre AS grupo, a.cuatrimestre, c.nombre AS carrera
            FROM asignaciones a
            JOIN horarios h ON a.horario_id = h.id
            JOIN materias m ON a.materia_id = m.id
            JOIN docentes d ON a.docente_id = d.id
            JOIN grupos g ON a.grupo_id = g.id
            JOIN carreras c ON a.carrera_id = c.id
            WHERE a.carrera_id = %s AND a.cuatrimestre = %s AND a.grupo_id = %s
            ORDER BY h.dia, h.hora_inicio
        """
        cur.execute(query, (carrera_id, cuatrimestre, grupo_id))
        resultados = cur.fetchall()
        return jsonify(resultados)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@horarios_bp.route('/asignaciones/editar-masivo', methods=['PUT'])
def editar_horarios_masivo():
    data = request.get_json()
    asignaciones = data.get('asignaciones', [])

    if not asignaciones:
        return jsonify({'error': 'No se recibieron asignaciones'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        for asignacion in asignaciones:
            dia = asignacion.get('dia')
            hora = asignacion.get('hora')
            aula = asignacion.get('aula')
            materia = asignacion.get('materia', '').strip()
            docente = asignacion.get('docente', '').strip()

            # Obtener horario_id por día, hora y aula
            hora_inicio, hora_fin = hora.split("-")
            cur.execute("""
                SELECT id FROM horarios 
                WHERE dia = %s AND hora_inicio = %s AND hora_fin = %s AND aula = %s
            """, (dia, hora_inicio.strip(), hora_fin.strip(), aula))
            horario = cur.fetchone()
            if not horario:
                continue
            horario_id = horario[0]

            # Buscar asignación existente
            cur.execute("""
                SELECT a.id FROM asignaciones a
                JOIN docentes d ON a.docente_id = d.id
                JOIN materias m ON a.materia_id = m.id
                WHERE a.horario_id = %s AND a.grupo_id IN (
                    SELECT id FROM grupos WHERE nombre = %s
                )
            """, (horario_id, asignacion.get('grupo')))
            resultado = cur.fetchone()

            # Si materia o docente vacíos, eliminar asignación
            if materia == '' or docente == '':
                if resultado:
                    cur.execute("DELETE FROM asignaciones WHERE id = %s", (resultado[0],))
                continue

            # Obtener IDs
            cur.execute("SELECT id FROM materias WHERE materia = %s", (materia,))
            materia_row = cur.fetchone()
            cur.execute("SELECT id FROM docentes WHERE nombre = %s", (docente,))
            docente_row = cur.fetchone()
            cur.execute("SELECT id FROM grupos WHERE nombre = %s", (asignacion.get('grupo'),))
            grupo_row = cur.fetchone()
            cur.execute("SELECT id FROM carreras WHERE nombre = %s", (asignacion.get('carrera'),))
            carrera_row = cur.fetchone()

            if not all([materia_row, docente_row, grupo_row, carrera_row]):
                continue

            materia_id = materia_row[0]
            docente_id = docente_row[0]
            grupo_id = grupo_row[0]
            carrera_id = carrera_row[0]
            cuatrimestre = asignacion.get('cuatrimestre')

            if resultado:
                # Actualizar si ya existe
                cur.execute("""
                    UPDATE asignaciones
                    SET materia_id = %s, docente_id = %s, grupo_id = %s,
                        cuatrimestre = %s, carrera_id = %s
                    WHERE id = %s
                """, (materia_id, docente_id, grupo_id, cuatrimestre, carrera_id, resultado[0]))
            else:
                # Insertar si no existe
                cur.execute("""
                    INSERT INTO asignaciones (docente_id, materia_id, horario_id, grupo_id, cuatrimestre, carrera_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (docente_id, materia_id, horario_id, grupo_id, cuatrimestre, carrera_id))

        conn.commit()
        return jsonify({'mensaje': 'Asignaciones actualizadas correctamente.'}), 200

    except Exception as e:
        conn.rollback()
        print("Error en editar-masivo:", e)
        return jsonify({'error': str(e)}), 500

    finally:
        cur.close()
        conn.close()