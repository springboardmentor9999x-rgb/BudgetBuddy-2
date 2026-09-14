import psycopg2
import sys

try:
    conn = psycopg2.connect(dbname="postgres", user="postgres", password="postgres", host="localhost", port="5432")
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datname NOT LIKE 'template%';")
    dbs = cur.fetchall()
    print("Databases:")
    for db in dbs:
        print(db[0])
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
