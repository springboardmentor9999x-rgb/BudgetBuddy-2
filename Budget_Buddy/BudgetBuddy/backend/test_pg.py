import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

def ensure_db():
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if budget_buddy exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'budget_buddy'")
        exists = cur.fetchone()
        
        if not exists:
            print("Database budget_buddy does not exist. Creating it...")
            cur.execute("CREATE DATABASE budget_buddy")
            print("Created successfully.")
        else:
            print("Database budget_buddy already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

ensure_db()
sys.exit(0)
