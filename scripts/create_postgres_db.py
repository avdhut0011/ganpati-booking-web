import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database(host="localhost", port=5432, user="postgres", password="password", dbname="ganpatidb"):
    try:
        # Connect to default postgres maintenance database
        con = psycopg2.connect(
            dbname="postgres",
            user=user,
            host=host,
            password=password,
            port=port
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = con.cursor()
        
        # Check if database already exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {dbname} WITH ENCODING 'UTF8';")
            print(f"🎉 Database '{dbname}' created successfully with UTF-8 encoding!")
        else:
            print(f"✅ Database '{dbname}' already exists.")
            
        cursor.close()
        con.close()
        return True
    except Exception as e:
        print(f"❌ Error connecting or creating database: {e}")
        return False

if __name__ == "__main__":
    import sys
    pw = input("Enter your PostgreSQL 'postgres' superuser password: ")
    create_database(password=pw)
