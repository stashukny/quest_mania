from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import asyncpg
from asyncpg.pool import Pool
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
async def get_db_pool() -> Pool:
    return await asyncpg.create_pool(
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', '5432')
    )

# Initialize database pool on startup
@app.on_event("startup")
async def startup():
    app.state.pool = await get_db_pool()

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

# Pydantic models
class Seeker(BaseModel):
    id: str
    name: str
    pin: str
    avatar_url: Optional[str] = None
    stars: int = 0

class Quest(BaseModel):
    id: str
    title: str
    description: Optional[str]
    reward: int
    status: str
    duration: str
    assigned_to: str
    started_at: Optional[str]
    completed_at: Optional[str]

# Pydantic models for new endpoints
class QuestSuggestion(BaseModel):
    id: str
    title: str
    description: Optional[str]
    suggested_by: str
    status: str
    created_at: str
    desired_reward: int
    duration: str

class Prize(BaseModel):
    id: str
    name: str
    description: Optional[str]
    stars_cost: int
    image_url: Optional[str]
    available: bool = True

# Initial routes
@app.get("/api/seekers")
async def get_seekers():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM seekers')
        return [dict(row) for row in rows]

@app.post("/api/seekers")
async def create_seeker(seeker: Seeker):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                INSERT INTO seekers (id, name, pin, avatar_url, stars) 
                VALUES ($1, $2, $3, $4, $5)
            ''', seeker.id, seeker.name, seeker.pin, seeker.avatar_url, seeker.stars)
            return seeker
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 

# Quest routes
@app.get("/api/quests")
async def get_quests():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM quests')
        return [dict(row) for row in rows]

@app.post("/api/quests")
async def create_quest(quest: Quest):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                INSERT INTO quests (id, title, description, reward, status, duration, assigned_to)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            ''', quest.id, quest.title, quest.description, quest.reward, 
                quest.status, quest.duration, quest.assigned_to)
            return quest
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests/{quest_id}/approve")
async def approve_quest(quest_id: str, seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            async with conn.transaction():
                # Update quest status
                now = datetime.utcnow().isoformat()
                await conn.execute('''
                    UPDATE quests 
                    SET status = $1, completed_at = $2 
                    WHERE id = $3
                ''', 'completed', now, quest_id)
                
                # Get quest reward
                quest = await conn.fetchrow(
                    'SELECT reward FROM quests WHERE id = $1', 
                    quest_id
                )
                if not quest:
                    raise HTTPException(status_code=404, detail="Quest not found")
                
                # Update seeker's stars
                await conn.execute('''
                    UPDATE seekers 
                    SET stars = stars + $1 
                    WHERE id = $2
                ''', quest['reward'], seeker_id)
                
                return {
                    "status": "completed",
                    "completed_at": now,
                    "reward": quest['reward']
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests/{quest_id}/reject")
async def reject_quest(quest_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                UPDATE quests 
                SET status = $1, completed_at = NULL 
                WHERE id = $2
            ''', 'in_progress', quest_id)
            
            return {
                "status": "in_progress",
                "message": "Quest completion rejected"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests/{quest_id}/start")
async def start_quest(quest_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            now = datetime.utcnow().isoformat()
            await conn.execute('''
                UPDATE quests 
                SET status = $1, started_at = $2 
                WHERE id = $3
            ''', 'in_progress', now, quest_id)
            
            return {
                "status": "in_progress",
                "started_at": now
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 

# Quest suggestion endpoints
@app.get("/api/quest-suggestions")
async def get_quest_suggestions():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM quest_suggestions')
        return [dict(row) for row in rows]

@app.post("/api/quest-suggestions")
async def create_quest_suggestion(suggestion: QuestSuggestion):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                INSERT INTO quest_suggestions 
                (id, title, description, suggested_by, status, created_at, desired_reward, duration)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ''', suggestion.id, suggestion.title, suggestion.description,
                suggestion.suggested_by, 'pending', datetime.utcnow().isoformat(),
                suggestion.desired_reward, suggestion.duration)
            return suggestion
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quest-suggestions/{suggestion_id}/approve")
async def approve_suggestion(suggestion_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            async with conn.transaction():
                # Get suggestion details
                suggestion = await conn.fetchrow(
                    'SELECT * FROM quest_suggestions WHERE id = $1',
                    suggestion_id
                )
                if not suggestion:
                    raise HTTPException(status_code=404, detail="Suggestion not found")

                # Create new quest
                quest_id = str(uuid.uuid4())
                await conn.execute('''
                    INSERT INTO quests 
                    (id, title, description, reward, status, duration, assigned_to)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                ''', quest_id, suggestion['title'], suggestion['description'],
                    suggestion['desired_reward'], 'active', suggestion['duration'],
                    suggestion['suggested_by'])

                # Update suggestion status
                await conn.execute(
                    'UPDATE quest_suggestions SET status = $1 WHERE id = $2',
                    'approved', suggestion_id
                )

                return {
                    "suggestion": dict(suggestion),
                    "quest": {
                        "id": quest_id,
                        "title": suggestion['title'],
                        "description": suggestion['description'],
                        "reward": suggestion['desired_reward'],
                        "status": 'active',
                        "duration": suggestion['duration'],
                        "assigned_to": suggestion['suggested_by']
                    }
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Prize management endpoints
@app.get("/api/prizes")
async def get_prizes():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM prizes WHERE available = true')
        return [dict(row) for row in rows]

@app.post("/api/prizes/redeem")
async def redeem_prize(prize_id: str, seeker_id: str, stars_cost: int):
    async with app.state.pool.acquire() as conn:
        try:
            async with conn.transaction():
                # Update seeker's stars
                result = await conn.execute('''
                    UPDATE seekers 
                    SET stars = stars - $1 
                    WHERE id = $2 AND stars >= $1
                ''', stars_cost, seeker_id)
                
                if result == 'UPDATE 0':
                    raise HTTPException(status_code=400, detail="Insufficient stars")

                # Create redemption record
                redemption_id = str(uuid.uuid4())
                certificate_id = str(uuid.uuid4())
                now = datetime.utcnow().isoformat()
                
                await conn.execute('''
                    INSERT INTO prize_redemptions 
                    (id, prize_id, seeker_id, redeemed_at, certificate_id, stars_cost)
                    VALUES ($1, $2, $3, $4, $5, $6)
                ''', redemption_id, prize_id, seeker_id, now, certificate_id, stars_cost)

                return {"certificate_id": certificate_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 

# Prize CRUD operations
@app.post("/api/prizes")
async def create_prize(prize: Prize):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                INSERT INTO prizes (id, name, description, stars_cost, image_url, available)
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', prize.id, prize.name, prize.description, prize.stars_cost,
                prize.image_url, prize.available)
            return prize
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/prizes/{prize_id}")
async def update_prize(prize_id: str, prize: Prize):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                UPDATE prizes 
                SET name = $1, description = $2, stars_cost = $3, 
                    image_url = $4, available = $5
                WHERE id = $6
            ''', prize.name, prize.description, prize.stars_cost,
                prize.image_url, prize.available, prize_id)
            return {**prize.dict(), "id": prize_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/prizes/{prize_id}")
async def delete_prize(prize_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            # Check for existing redemptions
            redemptions = await conn.fetchval(
                'SELECT COUNT(*) FROM prize_redemptions WHERE prize_id = $1',
                prize_id
            )
            
            if redemptions > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete prize with existing redemptions"
                )
            
            await conn.execute('DELETE FROM prizes WHERE id = $1', prize_id)
            return {"message": "Prize deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Quest history and completion endpoints
@app.get("/api/quests/history")
async def get_quest_history():
    async with app.state.pool.acquire() as conn:
        try:
            rows = await conn.fetch('''
                SELECT q.*, s.name as seeker_name 
                FROM quests q 
                LEFT JOIN seekers s ON q.assigned_to = s.id 
                WHERE q.status = 'completed' 
                ORDER BY q.completed_at DESC
            ''')
            return [dict(row) for row in rows]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/seekers/{seeker_id}/quests")
async def get_seeker_quests(seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            rows = await conn.fetch('''
                SELECT * FROM quests 
                WHERE status IN ('active', 'in_progress', 'pending')
                AND assigned_to = $1
            ''', seeker_id)
            return [dict(row) for row in rows]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests/{quest_id}/complete")
async def complete_quest(quest_id: str, seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            now = datetime.utcnow().isoformat()
            await conn.execute('''
                UPDATE quests 
                SET status = 'pending', completed_at = $1 
                WHERE id = $2 AND assigned_to = $3
            ''', now, quest_id, seeker_id)
            
            return {
                "status": "pending",
                "completed_at": now
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 