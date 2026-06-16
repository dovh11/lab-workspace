from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS rsvps, journal_clubs, document_versions, documents, ai_experiments, project_members, projects, users CASCADE;"))
    conn.execute(text("DROP TYPE IF EXISTS projectstatus, roleinproject, doctype, systemrole, rsvpstatus CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
    conn.commit()
print("Database cleanly dropped!")
