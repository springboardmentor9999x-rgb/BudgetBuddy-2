from app.database import engine
from sqlalchemy import text

def alter_tables():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE savings_goals ADD COLUMN notified_thresholds VARCHAR(100) DEFAULT '' NOT NULL;"))
            print("Added to savings_goals")
        except Exception as e:
            print("savings_goals:", e)

        try:
            conn.execute(text("ALTER TABLE budgets ADD COLUMN notified_thresholds VARCHAR(100) DEFAULT '' NOT NULL;"))
            print("Added to budgets")
        except Exception as e:
            print("budgets:", e)
        
        conn.commit()

if __name__ == "__main__":
    alter_tables()
