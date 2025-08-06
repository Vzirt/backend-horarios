# backend/models/user_model.py

from utils.db import get_connection

class UserModel:
    @staticmethod
    def find_by_username(username):
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            "SELECT username, password, role FROM users WHERE username = %s",
            (username,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return None
        return {
            'username': row[0],
            'password': row[1],
            'role':     row[2]
        }
