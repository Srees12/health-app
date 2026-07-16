from fastapi import FastAPI
import asyncpg
import redis
import os
import uuid

app = FastAPI()

# Grab these from Render's environment
DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

@app.on_event("startup")
async def startup():
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS triage_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            symptoms TEXT,
            risk TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    await conn.close()
    print("✅ DB Ready!")

@app.get("/")
async def root():
    return {"message": "🚀 Healthcare API is LIVE on Render!"}

@app.post("/triage")
async def triage(symptoms: dict):
    text = symptoms.get("text", "").lower()
    
    # Simple brain
    if "chest" in text or "unconscious" in text:
        risk = "HIGH"
        action = "🚑 Ambulance Dispatched!"
    else:
        risk = "LOW"
        action = "💊 Rest at home."

    # Save to Cloud DB
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute(
        "INSERT INTO triage_logs (symptoms, risk) VALUES ($1, $2)",
        text, risk
    )
    await conn.close()

    # If high, ping Redis for WebSocket
    if risk == "HIGH":
        incident_id = str(uuid.uuid4())
        redis_client.set(f"incident:{incident_id}", "active")
        redis_client.publish("alerts", f"NEW_ALERT:{incident_id}")

    return {"risk": risk, "action": action}
