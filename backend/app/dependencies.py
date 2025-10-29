# Simplified dependency to provide a DB session placeholder.
def get_db():
    # In real app: yield SQLAlchemy session
    class Dummy: pass
    return Dummy()
