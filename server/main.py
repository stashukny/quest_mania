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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ],
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
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

# Pydantic models for new endpoints
class QuestSuggestion(BaseModel):
    id: str
    title: str
    description: Optional[str]
    suggested_by: str
    status: str = 'pending'
    created_at: Optional[str] = None
    desired_reward: int
    duration: str

class Prize(BaseModel):
    id: str
    name: str
    description: Optional[str]
    stars_cost: int
    image_url: Optional[str]
    available: bool = True

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reward: Optional[int] = None
    status: Optional[str] = None
    duration: Optional[str] = None
    assigned_to: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class SeekerUpdate(BaseModel):
    name: str
    pin: str
    avatarUrl: Optional[str] = None  # Frontend property
    avatar_url: Optional[str] = None  # Database property
    stars: int

class QuestCompleteRequest(BaseModel):
    seeker_id: str

class QuestApproveRequest(BaseModel):
    seekerId: str

class PrizeRedemption(BaseModel):
    id: str
    prize_id: str
    seeker_id: str
    redeemed_at: str
    certificate_id: str
    stars_cost: int

# Initial routes
@app.get("/api/seekers")
async def get_seekers():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM seekers')
        # Convert rows to use frontend property name
        return [{
            **dict(row),
            'avatarUrl': row['avatar_url'],
            'id': row['id'],
            'name': row['name'],
            'pin': row['pin'],
            'stars': row['stars']
        } for row in rows]

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
        try:
            rows = await conn.fetch('SELECT * FROM quests')
            quests = [dict(row) for row in rows]
            print(f"Returning quests: {quests}")  # Debug log
            return quests
        except Exception as e:
            print(f"Error fetching quests: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests")
async def create_quest(quest: Quest):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('''
                INSERT INTO quests 
                (id, title, description, reward, status, duration, assigned_to)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            ''', quest.id, quest.title, quest.description, quest.reward,
                quest.status, quest.duration, quest.assigned_to)
            return quest
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quests/{quest_id}/approve")
async def approve_quest(quest_id: str, request: QuestApproveRequest):
    async with app.state.pool.acquire() as conn:
        try:
            async with conn.transaction():
                # First verify the quest exists
                quest = await conn.fetchrow(
                    'SELECT * FROM quests WHERE id = $1',
                    quest_id
                )
                if not quest:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Quest {quest_id} not found"
                    )

                # Update quest status
                now = datetime.utcnow()
                await conn.execute('''
                    UPDATE quests 
                    SET status = $1, completed_at = $2 
                    WHERE id = $3
                ''', 'completed', now, quest_id)
                
                # Update seeker's stars
                await conn.execute('''
                    UPDATE seekers 
                    SET stars = stars + $1 
                    WHERE id = $2
                ''', quest['reward'], request.seekerId)
                
                return {
                    "status": "completed",
                    "completed_at": now.isoformat(),
                    "reward": quest['reward']
                }
        except Exception as e:
            print(f"Error approving quest: {str(e)}")
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
async def start_quest(quest_id: str, seekerId: str = None):
    async with app.state.pool.acquire() as conn:
        try:
            now = datetime.utcnow()
            
            # First check if the quest exists and is assignable
            quest = await conn.fetchrow('SELECT * FROM quests WHERE id = $1', quest_id)
            if not quest:
                raise HTTPException(status_code=404, detail="Quest not found")
            
            # Update the quest status
            await conn.execute('''
                UPDATE quests 
                SET status = $1, started_at = $2 
                WHERE id = $3 AND assigned_to = $4
            ''', 'in_progress', now, quest_id, seekerId)
            
            return {
                "status": "in_progress",
                "started_at": now.isoformat()
            }
        except Exception as e:
            print(f"Error starting quest: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/quests/{quest_id}")
async def update_quest(quest_id: str, quest_update: QuestUpdate):
    print(f"Updating quest {quest_id} with data: {quest_update.dict(exclude_unset=True)}")  # Debug log
    async with app.state.pool.acquire() as conn:
        try:
            # First check if the quest exists
            existing_quest = await conn.fetchrow('SELECT * FROM quests WHERE id = $1', quest_id)
            if not existing_quest:
                print(f"Quest {quest_id} not found")
                raise HTTPException(status_code=404, detail="Quest not found")
            print(f"Found existing quest: {dict(existing_quest)}")  # Debug log

            # Build the SET clause dynamically based on provided fields
            update_fields = []
            params = []
            param_index = 1

            update_data = quest_update.dict(exclude_unset=True)
            print(f"Update data after dict conversion: {update_data}")  # Debug log

            for field, value in update_data.items():
                if value is not None:
                    # Convert ISO datetime strings to datetime objects
                    if field in ['started_at', 'completed_at'] and value:
                        try:
                            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        except Exception as e:
                            print(f"Error parsing datetime {value}: {str(e)}")
                            raise HTTPException(status_code=400, detail=f"Invalid datetime format for {field}")
                    
                    update_fields.append(f"{field} = ${param_index}")
                    params.append(value)
                    param_index += 1

            if not update_fields:
                print("No fields to update")  # Debug log
                raise HTTPException(status_code=400, detail="No fields to update")

            query = f"""
                UPDATE quests 
                SET {', '.join(update_fields)}
                WHERE id = ${param_index}
                RETURNING *
            """
            params.append(quest_id)
            
            print(f"Executing query: {query}")  # Debug log
            print(f"With parameters: {params}")  # Debug log

            try:
                updated_quest = await conn.fetchrow(query, *params)
                print(f"Query executed successfully")  # Debug log
            except Exception as db_error:
                print(f"Database error: {str(db_error)}")  # Debug log
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
            
            if not updated_quest:
                print(f"No quest was updated")  # Debug log
                raise HTTPException(status_code=404, detail="Quest not found")
            
            result = dict(updated_quest)
            print(f"Updated quest: {result}")  # Debug log
            return result
        except Exception as e:
            print(f"Error updating quest: {str(e)}")
            print(f"Error type: {type(e)}")  # Debug log
            print(f"Error details: {str(e)}")  # Debug log
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
            # Parse the created_at string into a datetime object
            created_at = datetime.fromisoformat(suggestion.created_at.replace('Z', '+00:00')) if suggestion.created_at else datetime.utcnow()
            
            await conn.execute('''
                INSERT INTO quest_suggestions 
                (id, title, description, suggested_by, status, created_at, desired_reward, duration)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ''', suggestion.id, suggestion.title, suggestion.description, 
                suggestion.suggested_by, suggestion.status, created_at,  # Use the parsed datetime
                suggestion.desired_reward, suggestion.duration)
            
            return {
                **suggestion.dict(),
                "created_at": created_at.isoformat()  # Convert back to ISO string for response
            }
        except Exception as e:
            print(f"Error creating quest suggestion: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quest-suggestions/{suggestion_id}/approve")
async def approve_quest_suggestion(suggestion_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            # First get the suggestion
            suggestion = await conn.fetchrow(
                'SELECT * FROM quest_suggestions WHERE id = $1',
                suggestion_id
            )
            if not suggestion:
                raise HTTPException(status_code=404, detail="Suggestion not found")

            # Update suggestion status
            await conn.execute('''
                UPDATE quest_suggestions 
                SET status = 'approved' 
                WHERE id = $1
            ''', suggestion_id)

            # Create a new quest from the suggestion
            quest_id = str(uuid.uuid4())
            await conn.execute('''
                INSERT INTO quests 
                (id, title, description, reward, status, duration, assigned_to)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            ''', quest_id, suggestion['title'], suggestion['description'],
                suggestion['desired_reward'], 'active', suggestion['duration'],
                suggestion['suggested_by'])

            return {"message": "Suggestion approved and quest created"}
        except Exception as e:
            print(f"Error approving suggestion: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quest-suggestions/{suggestion_id}/reject")
async def reject_quest_suggestion(suggestion_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            # Update suggestion status
            await conn.execute('''
                UPDATE quest_suggestions 
                SET status = 'rejected' 
                WHERE id = $1
            ''', suggestion_id)

            return {"message": "Suggestion rejected"}
        except Exception as e:
            print(f"Error rejecting suggestion: {str(e)}")
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
                INSERT INTO prizes 
                (id, name, description, stars_cost, image_url, available) 
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', prize.id, prize.name, prize.description, 
                prize.stars_cost, prize.image_url, prize.available)
            return prize
        except Exception as e:
            print(f"Error creating prize: {str(e)}")
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
async def complete_quest(quest_id: str, request: QuestCompleteRequest):
    async with app.state.pool.acquire() as conn:
        try:
            # First verify the quest exists and belongs to this seeker
            quest = await conn.fetchrow(
                'SELECT * FROM quests WHERE id = $1 AND assigned_to = $2',
                quest_id, request.seeker_id
            )
            if not quest:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Quest {quest_id} not found or not assigned to seeker {request.seeker_id}"
                )

            now = datetime.utcnow()
            await conn.execute('''
                UPDATE quests 
                SET status = 'pending', completed_at = $1 
                WHERE id = $2 AND assigned_to = $3
            ''', now, quest_id, request.seeker_id)
            
            return {
                "status": "pending",
                "completed_at": now.isoformat()
            }
        except Exception as e:
            print(f"Error completing quest: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/seekers/{seeker_id}")
async def delete_seeker(seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('DELETE FROM seekers WHERE id = $1', seeker_id)
            return {
                "message": f"Seeker {seeker_id} deleted successfully"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/seekers/{seeker_id}")
async def update_seeker(seeker_id: str, seeker: SeekerUpdate):
    async with app.state.pool.acquire() as conn:
        try:
            # Use avatarUrl if provided, otherwise use avatar_url
            avatar_url = seeker.avatarUrl or seeker.avatar_url
            
            await conn.execute('''
                UPDATE seekers 
                SET name = $1, pin = $2, avatar_url = $3, stars = $4 
                WHERE id = $5
            ''', seeker.name, seeker.pin, avatar_url, seeker.stars, seeker_id)
            
            # Return response using frontend property name
            return {
                "id": seeker_id,
                "name": seeker.name,
                "pin": seeker.pin,
                "avatarUrl": avatar_url,
                "stars": seeker.stars
            }
        except Exception as e:
            print(f"Error updating seeker: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/quests/{quest_id}")
async def delete_quest(quest_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            await conn.execute('DELETE FROM quests WHERE id = $1', quest_id)
            return {
                "message": f"Quest {quest_id} deleted successfully"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/seekers/{seeker_id}")
async def get_seeker(seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            # Get seeker's base info
            seeker = await conn.fetchrow(
                'SELECT * FROM seekers WHERE id = $1',
                seeker_id
            )
            if not seeker:
                raise HTTPException(status_code=404, detail="Seeker not found")

            # Get total stars from completed quests and subtract redeemed stars
            available_stars = await conn.fetchval('''
                SELECT 
                    (
                        SELECT COALESCE(SUM(reward), 0)
                        FROM quests 
                        WHERE assigned_to = $1 
                        AND status = 'completed'
                    ) - 
                    (
                        SELECT COALESCE(SUM(stars_cost), 0)
                        FROM prize_redemptions 
                        WHERE seeker_id = $1
                    )
            ''', seeker_id)

            # Convert to use frontend property name
            return {
                **dict(seeker),
                'avatarUrl': seeker['avatar_url'],
                'stars': available_stars or 0  # Ensure we return 0 instead of None
            }
        except Exception as e:
            print(f"Error fetching seeker: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prize-redemptions")
async def create_prize_redemption(redemption: PrizeRedemption):
    async with app.state.pool.acquire() as conn:
        try:
            async with conn.transaction():  # Use transaction to ensure both operations succeed or fail
                # Convert ISO string to datetime object
                redeemed_at = datetime.fromisoformat(redemption.redeemed_at.replace('Z', '+00:00'))
                
                # Insert the redemption
                await conn.execute('''
                    INSERT INTO prize_redemptions 
                    (id, prize_id, seeker_id, redeemed_at, certificate_id, stars_cost)
                    VALUES ($1, $2, $3, $4, $5, $6)
                ''', redemption.id, redemption.prize_id, redemption.seeker_id,
                    redeemed_at,
                    redemption.certificate_id, redemption.stars_cost)

                # Update seeker's stars in the seekers table
                await conn.execute('''
                    UPDATE seekers 
                    SET stars = stars - $1 
                    WHERE id = $2
                ''', redemption.stars_cost, redemption.seeker_id)

                return {
                    **redemption.dict(),
                    "redeemed_at": redeemed_at.isoformat()
                }
        except Exception as e:
            print(f"Error creating prize redemption: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/seekers/{seeker_id}/redemptions")
async def get_seeker_redemptions(seeker_id: str):
    async with app.state.pool.acquire() as conn:
        try:
            # Add debug logging
            print(f"Fetching redemptions for seeker: {seeker_id}")
            
            rows = await conn.fetch('''
                SELECT 
                    pr.id,
                    pr.certificate_id,
                    pr.redeemed_at,
                    pr.stars_cost,
                    p.name as prize_name
                FROM prize_redemptions pr
                JOIN prizes p ON pr.prize_id = p.id
                WHERE pr.seeker_id = $1
                ORDER BY pr.redeemed_at DESC
            ''', seeker_id)
            
            # Add debug logging
            print(f"Found {len(rows)} redemptions")
            for row in rows:
                print(f"Redemption: {dict(row)}")
            
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error fetching seeker redemptions: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prize-redemptions")
async def get_all_redemptions():
    async with app.state.pool.acquire() as conn:
        try:
            rows = await conn.fetch('''
                SELECT 
                    pr.id,
                    pr.certificate_id,
                    pr.redeemed_at,
                    pr.stars_cost,
                    p.name as prize_name,
                    s.name as seeker_name
                FROM prize_redemptions pr
                JOIN prizes p ON pr.prize_id = p.id
                JOIN seekers s ON pr.seeker_id = s.id
                ORDER BY pr.redeemed_at DESC
            ''')
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error fetching redemptions: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

