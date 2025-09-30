"""FastAPI server exposing AI agent endpoints."""

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from ai_agents.agents import AgentConfig, ChatAgent, SearchAgent
from baby_generator import BabyImageGenerator


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ChatRequest(BaseModel):
    message: str
    agent_type: str = "chat"
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    agent_type: str
    capabilities: List[str]
    metadata: dict = Field(default_factory=dict)
    error: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    max_results: int = 5


class SearchResponse(BaseModel):
    success: bool
    query: str
    summary: str
    search_results: Optional[dict] = None
    sources_count: int
    error: Optional[str] = None


class BabyGenerateRequest(BaseModel):
    name: str


class BabyGenerateResponse(BaseModel):
    success: bool
    image_id: str
    image_data: Optional[str] = None
    error: Optional[str] = None


class AgeProgressRequest(BaseModel):
    image_id: str
    name: str
    age_group: str


class AgeProgressResponse(BaseModel):
    success: bool
    image_data: Optional[str] = None
    age_group: str
    error: Optional[str] = None


class WatermarkRequest(BaseModel):
    image_data: str
    name: str
    age: str


class WatermarkResponse(BaseModel):
    success: bool
    watermarked_image: Optional[str] = None
    error: Optional[str] = None


def _ensure_db(request: Request):
    try:
        return request.app.state.db
    except AttributeError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=503, detail="Database not ready") from exc


def _get_agent_cache(request: Request) -> Dict[str, object]:
    if not hasattr(request.app.state, "agent_cache"):
        request.app.state.agent_cache = {}
    return request.app.state.agent_cache


async def _get_or_create_agent(request: Request, agent_type: str):
    cache = _get_agent_cache(request)
    if agent_type in cache:
        return cache[agent_type]

    config: AgentConfig = request.app.state.agent_config

    if agent_type == "search":
        cache[agent_type] = SearchAgent(config)
    elif agent_type == "chat":
        cache[agent_type] = ChatAgent(config)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown agent type '{agent_type}'")

    return cache[agent_type]


def _get_baby_generator(request: Request) -> BabyImageGenerator:
    if not hasattr(request.app.state, "baby_generator"):
        config: AgentConfig = request.app.state.agent_config
        request.app.state.baby_generator = BabyImageGenerator(config)
    return request.app.state.baby_generator


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv(ROOT_DIR / ".env")

    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        missing = [name for name, value in {"MONGO_URL": mongo_url, "DB_NAME": db_name}.items() if not value]
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    client = AsyncIOMotorClient(mongo_url)

    try:
        app.state.mongo_client = client
        app.state.db = client[db_name]
        app.state.agent_config = AgentConfig()
        app.state.agent_cache = {}
        logger.info("AI Agents API starting up")
        yield
    finally:
        client.close()
        logger.info("AI Agents API shutdown complete")


app = FastAPI(
    title="AI Agents API",
    description="Minimal AI Agents API with LangGraph and MCP support",
    lifespan=lifespan,
)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate, request: Request):
    db = _ensure_db(request)
    status_obj = StatusCheck(**input.model_dump())
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(request: Request):
    db = _ensure_db(request)
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(chat_request: ChatRequest, request: Request):
    try:
        agent = await _get_or_create_agent(request, chat_request.agent_type)
        response = await agent.execute(chat_request.message)

        return ChatResponse(
            success=response.success,
            response=response.content,
            agent_type=chat_request.agent_type,
            capabilities=agent.get_capabilities(),
            metadata=response.metadata,
            error=response.error,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in chat endpoint")
        return ChatResponse(
            success=False,
            response="",
            agent_type=chat_request.agent_type,
            capabilities=[],
            error=str(exc),
        )


@api_router.post("/search", response_model=SearchResponse)
async def search_and_summarize(search_request: SearchRequest, request: Request):
    try:
        search_agent = await _get_or_create_agent(request, "search")
        search_prompt = (
            f"Search for information about: {search_request.query}. "
            "Provide a comprehensive summary with key findings."
        )
        result = await search_agent.execute(search_prompt, use_tools=True)

        if result.success:
            metadata = result.metadata or {}
            return SearchResponse(
                success=True,
                query=search_request.query,
                summary=result.content,
                search_results=metadata,
                sources_count=int(metadata.get("tool_run_count", metadata.get("tools_used", 0)) or 0),
            )

        return SearchResponse(
            success=False,
            query=search_request.query,
            summary="",
            sources_count=0,
            error=result.error,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error in search endpoint")
        return SearchResponse(
            success=False,
            query=search_request.query,
            summary="",
            sources_count=0,
            error=str(exc),
        )


@api_router.get("/agents/capabilities")
async def get_agent_capabilities(request: Request):
    try:
        search_agent = await _get_or_create_agent(request, "search")
        chat_agent = await _get_or_create_agent(request, "chat")

        return {
            "success": True,
            "capabilities": {
                "search_agent": search_agent.get_capabilities(),
                "chat_agent": chat_agent.get_capabilities(),
            },
        }
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Error getting capabilities")
        return {"success": False, "error": str(exc)}


@api_router.post("/baby/generate", response_model=BabyGenerateResponse)
async def generate_baby_image(baby_request: BabyGenerateRequest, request: Request):
    """Generate a photorealistic baby image from a name."""
    try:
        db = _ensure_db(request)
        generator = _get_baby_generator(request)

        # Generate baby image
        image_data = await generator.generate_baby_image(baby_request.name)

        if not image_data:
            return BabyGenerateResponse(
                success=False,
                image_id="",
                error="Failed to generate baby image"
            )

        # Create image record
        image_id = str(uuid.uuid4())
        baby_record = {
            "_id": image_id,
            "name": baby_request.name,
            "original_image": image_data,
            "age_versions": {},
            "created_at": datetime.now(timezone.utc)
        }

        await db.baby_images.insert_one(baby_record)

        return BabyGenerateResponse(
            success=True,
            image_id=image_id,
            image_data=image_data
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error generating baby image")
        return BabyGenerateResponse(
            success=False,
            image_id="",
            error=str(exc)
        )


@api_router.post("/baby/age-progress", response_model=AgeProgressResponse)
async def age_progress_image(age_request: AgeProgressRequest, request: Request):
    """Generate an age-progressed version of the baby."""
    try:
        db = _ensure_db(request)
        generator = _get_baby_generator(request)

        # Check if we already have this age version cached
        baby_record = await db.baby_images.find_one({"_id": age_request.image_id})

        if not baby_record:
            return AgeProgressResponse(
                success=False,
                age_group=age_request.age_group,
                error="Baby image not found"
            )

        # Check cache first
        age_versions = baby_record.get("age_versions", {})
        if age_request.age_group in age_versions:
            return AgeProgressResponse(
                success=True,
                image_data=age_versions[age_request.age_group],
                age_group=age_request.age_group
            )

        # Generate aged image
        aged_image = await generator.generate_aged_image(
            age_request.name,
            age_request.age_group
        )

        if not aged_image:
            return AgeProgressResponse(
                success=False,
                age_group=age_request.age_group,
                error="Failed to generate aged image"
            )

        # Cache the result
        await db.baby_images.update_one(
            {"_id": age_request.image_id},
            {"$set": {f"age_versions.{age_request.age_group}": aged_image}}
        )

        return AgeProgressResponse(
            success=True,
            image_data=aged_image,
            age_group=age_request.age_group
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error generating aged image")
        return AgeProgressResponse(
            success=False,
            age_group=age_request.age_group,
            error=str(exc)
        )


@api_router.post("/baby/watermark", response_model=WatermarkResponse)
async def add_watermark_to_image(watermark_request: WatermarkRequest, request: Request):
    """Add name and age watermark to the image."""
    try:
        generator = _get_baby_generator(request)

        watermarked_image = generator.add_watermark(
            watermark_request.image_data,
            watermark_request.name,
            watermark_request.age
        )

        return WatermarkResponse(
            success=True,
            watermarked_image=watermarked_image
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error adding watermark")
        return WatermarkResponse(
            success=False,
            error=str(exc)
        )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
