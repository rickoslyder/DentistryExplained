import os
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from gpt_researcher import GPTResearcher

load_dotenv()

app = FastAPI(title="GPT Researcher Service for Dentistry Explained")

# LiteLLM Configuration
LITELLM_PROXY_URL = os.getenv("LITELLM_PROXY_URL", "https://openai-proxy-0l7e.onrender.com")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY")

# Model Configuration - These will be passed through LiteLLM
FAST_LLM_MODEL = os.getenv("FAST_LLM_MODEL", "o4-mini")  # For quick research tasks
SMART_LLM_MODEL = os.getenv("SMART_LLM_MODEL", "o4")     # For comprehensive research
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Set OpenAI base URL to use LiteLLM proxy
os.environ["OPENAI_API_BASE"] = f"{LITELLM_PROXY_URL}/v1"
os.environ["OPENAI_API_KEY"] = LITELLM_API_KEY or "dummy-key-for-litellm"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://dentistry-explained.vercel.app",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_TOKEN = os.getenv("RESEARCH_SERVICE_AUTH_TOKEN", "development-token-change-in-production")

TRUSTED_DENTAL_SOURCES = [
    "nhs.uk",
    "nice.org.uk", 
    "bda.org",
    "gdc-uk.org",
    "ada.org",
    "cochrane.org",
    "ncbi.nlm.nih.gov/pubmed",
    "bmj.com",
    "nature.com/bdj",
    "journals.sagepub.com",
    "onlinelibrary.wiley.com",
    "sciencedirect.com",
    "thelancet.com"
]

class ResearchRequest(BaseModel):
    topic: str = Field(..., description="The dental topic to research")
    report_type: str = Field(default="research_report", description="Type of report to generate")
    sources_count: int = Field(default=10, ge=5, le=20, description="Number of sources to use")
    focus_medical: bool = Field(default=True, description="Prioritize medical/dental sources")
    include_citations: bool = Field(default=True, description="Include citations in the report")

class ResearchResponse(BaseModel):
    topic: str
    report: str
    sources: List[Dict[str, str]]
    metadata: Dict[str, Any]
    generated_at: str

def authenticate(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    if token != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "gpt-researcher",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/research", response_model=ResearchResponse)
async def conduct_research(
    request: ResearchRequest,
    authorization: Optional[str] = Header(None)
):
    authenticate(authorization)
    
    try:
        query = request.topic
        if request.focus_medical:
            query = f"{request.topic} site:({' OR site:'.join(TRUSTED_DENTAL_SOURCES)})"
        
        custom_config = {
            "max_iterations": request.sources_count,
            "retriever": "tavily",
            "report_format": "markdown",
            "include_citations": request.include_citations,
            # Use LiteLLM proxy with our models
            "fast_llm": FAST_LLM_MODEL,
            "smart_llm": SMART_LLM_MODEL,
            "embedding": EMBEDDING_MODEL,
            # Tell GPT-Researcher to use OpenAI provider (which will route through LiteLLM)
            "llm_provider": "openai"
        }
        
        researcher = GPTResearcher(
            query=query,
            report_type=request.report_type,
            config_path=None,
            verbose=True
        )
        
        if custom_config:
            for key, value in custom_config.items():
                setattr(researcher, key, value)
        
        research_result = await researcher.conduct_research()
        report = await researcher.write_report()
        
        sources = []
        if hasattr(researcher, 'sources') and researcher.sources:
            for source in researcher.sources[:request.sources_count]:
                sources.append({
                    "title": source.get("title", ""),
                    "url": source.get("url", ""),
                    "snippet": source.get("snippet", "")[:200] + "..." if source.get("snippet") else ""
                })
        
        return ResearchResponse(
            topic=request.topic,
            report=report,
            sources=sources,
            metadata={
                "report_type": request.report_type,
                "sources_count": len(sources),
                "medical_focus": request.focus_medical,
                "word_count": len(report.split())
            },
            generated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Research failed: {str(e)}"
        )

@app.post("/research/professional")
async def professional_research(
    request: ResearchRequest,
    authorization: Optional[str] = Header(None)
):
    authenticate(authorization)
    
    request.focus_medical = True
    request.sources_count = min(request.sources_count, 15)
    
    query_prefix = "clinical evidence systematic review meta-analysis "
    request.topic = query_prefix + request.topic
    
    return await conduct_research(request, authorization)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)