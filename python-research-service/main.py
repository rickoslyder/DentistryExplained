import os
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import time

from gpt_researcher import GPTResearcher

load_dotenv()

app = FastAPI(title="GPT Researcher Service for Dentistry Explained")

# LiteLLM Configuration
LITELLM_PROXY_URL = os.getenv("LITELLM_PROXY_URL", "https://llm.rbnk.uk")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY")

# Model Configuration - These will be passed through LiteLLM
FAST_LLM_MODEL = os.getenv("FAST_LLM_MODEL", "o4-mini")  # For quick research tasks
SMART_LLM_MODEL = os.getenv("SMART_LLM_MODEL", "o4-mini")  # Use o4-mini for now to avoid streaming issues
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
    audience: str = Field(default="general", description="Target audience: 'general' for patients/laypeople, 'professional' for dental professionals")
    reading_level: str = Field(default="intermediate", description="Reading level: 'basic', 'intermediate', or 'advanced'")

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

def get_audience_prompt(audience: str, reading_level: str) -> str:
    """Generate audience-specific instructions for the research"""
    prompts = {
        "general": {
            "basic": """Write for patients with no medical background. Use simple, everyday language. 
                       Explain all medical terms in plain English. Use short sentences and paragraphs. 
                       Focus on practical information patients can use. Avoid jargon completely.""",
            "intermediate": """Write for the general public interested in dental health. Use clear, 
                             accessible language. Define medical terms when first used. Include practical 
                             examples. Balance accuracy with readability.""",
            "advanced": """Write for educated laypeople who want detailed information. You can use 
                          medical terminology but provide clear explanations. Include more technical 
                          details while maintaining clarity."""
        },
        "professional": {
            "basic": """Write for dental students or new dental professionals. Include clinical 
                       terminology with brief explanations. Focus on practical clinical applications.""",
            "intermediate": """Write for practicing dental professionals. Use standard clinical 
                              terminology freely. Include evidence-based recommendations and clinical 
                              pearls. Reference current guidelines.""",
            "advanced": """Write for specialist dentists or researchers. Use advanced clinical and 
                          scientific terminology. Include detailed mechanisms, latest research findings, 
                          and nuanced clinical considerations."""
        }
    }
    
    return prompts.get(audience, {}).get(reading_level, prompts["general"]["intermediate"])

@app.post("/research", response_model=ResearchResponse)
async def conduct_research(
    request: ResearchRequest,
    authorization: Optional[str] = Header(None)
):
    authenticate(authorization)
    
    try:
        # Customize query based on audience
        query = request.topic
        if request.audience == "professional":
            query = f"clinical evidence {request.topic}"
        
        if request.focus_medical:
            query = f"{query} site:({' OR site:'.join(TRUSTED_DENTAL_SOURCES)})"
        
        # Get audience-specific prompt
        audience_prompt = get_audience_prompt(request.audience, request.reading_level)
        
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
            "llm_provider": "openai",
            # Disable streaming to avoid organization verification issues
            "stream": False,
            # Add custom prompt based on audience
            "custom_prompt": f"{audience_prompt}\n\nResearch topic: {request.topic}"
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
                "word_count": len(report.split()),
                "audience": request.audience,
                "reading_level": request.reading_level
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

async def research_stream_generator(request: ResearchRequest):
    """Generator function for streaming research progress"""
    try:
        # Send initial stages
        stages = [
            {"id": "init", "name": "Initializing research", "status": "completed"},
            {"id": "search", "name": "Searching for sources", "status": "active"},
            {"id": "analyze", "name": "Analyzing content", "status": "pending"},
            {"id": "synthesize", "name": "Synthesizing information", "status": "pending"},
            {"id": "generate", "name": "Generating report", "status": "pending"},
            {"id": "finalize", "name": "Finalizing document", "status": "pending"}
        ]
        yield f"data: {json.dumps({'type': 'stages', 'stages': stages})}\n\n"
        
        # Configure research
        query = request.topic
        if request.audience == "professional":
            query = f"clinical evidence {request.topic}"
        
        if request.focus_medical:
            query = f"{query} site:({' OR site:'.join(TRUSTED_DENTAL_SOURCES)})"
        
        audience_prompt = get_audience_prompt(request.audience, request.reading_level)
        
        custom_config = {
            "max_iterations": request.sources_count,
            "retriever": "tavily",
            "report_format": "markdown",
            "include_citations": request.include_citations,
            "fast_llm": FAST_LLM_MODEL,
            "smart_llm": SMART_LLM_MODEL,
            "embedding": EMBEDDING_MODEL,
            "llm_provider": "openai",
            "stream": False,
            "custom_prompt": f"{audience_prompt}\n\nResearch topic: {request.topic}"
        }
        
        # Update search stage
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'search', 'update': {'status': 'active', 'message': 'Searching trusted dental sources...'}})}\n\n"
        
        researcher = GPTResearcher(
            query=query,
            report_type=request.report_type,
            config_path=None,
            verbose=True
        )
        
        if custom_config:
            for key, value in custom_config.items():
                setattr(researcher, key, value)
        
        # Simulate progress updates (in real implementation, GPT-Researcher would emit these)
        await asyncio.sleep(2)
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'search', 'update': {'status': 'completed', 'message': f'Found {request.sources_count} relevant sources'}})}\n\n"
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'analyze', 'update': {'status': 'active', 'message': 'Reading and analyzing content...'}})}\n\n"
        
        # Conduct research
        research_result = await researcher.conduct_research()
        
        await asyncio.sleep(2)
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'analyze', 'update': {'status': 'completed'}})}\n\n"
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'synthesize', 'update': {'status': 'active', 'message': 'Organizing information...'}})}\n\n"
        
        await asyncio.sleep(1)
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'synthesize', 'update': {'status': 'completed'}})}\n\n"
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'generate', 'update': {'status': 'active', 'message': f'Writing {request.audience} level content...'}})}\n\n"
        
        # Generate report
        report = await researcher.write_report()
        
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'generate', 'update': {'status': 'completed'}})}\n\n"
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'finalize', 'update': {'status': 'active', 'message': 'Adding citations and formatting...'}})}\n\n"
        
        # Format sources
        sources = []
        if hasattr(researcher, 'sources') and researcher.sources:
            for source in researcher.sources[:request.sources_count]:
                sources.append({
                    "title": source.get("title", ""),
                    "url": source.get("url", ""),
                    "snippet": source.get("snippet", "")[:200] + "..." if source.get("snippet") else ""
                })
        
        # Format final content
        research_response = ResearchResponse(
            topic=request.topic,
            report=report,
            sources=sources,
            metadata={
                "report_type": request.report_type,
                "sources_count": len(sources),
                "medical_focus": request.focus_medical,
                "word_count": len(report.split()),
                "audience": request.audience,
                "reading_level": request.reading_level
            },
            generated_at=datetime.utcnow().isoformat()
        )
        
        formatted_content = formatResearchAsMarkdown(research_response)
        
        yield f"data: {json.dumps({'type': 'stage_update', 'stageId': 'finalize', 'update': {'status': 'completed'}})}\n\n"
        yield f"data: {json.dumps({'type': 'content', 'content': formatted_content})}\n\n"
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

def formatResearchAsMarkdown(research: ResearchResponse) -> str:
    """Format research response as markdown (matching the format in lib/research.ts)"""
    audience = research.metadata.get("audience", "general")
    reading_level = research.metadata.get("reading_level", "intermediate")
    
    header = f"""---
title: "Draft: {research.topic}"
excerpt: "An AI-generated research report on {research.topic}."
category: "dental-problems"
tags: ["AI-generated", "draft", "research", {audience}, {reading_level}]
status: "draft"
featured: false
reviewed: false
audience: "{audience}"
readingLevel: "{reading_level}"
generatedAt: "{research.generated_at}"
---

"""
    
    content = research.report
    
    sources_section = f"""

## Sources

{(chr(10) + chr(10)).join([f'{i+1}. [{source["title"]}]({source["url"]}){chr(10)}   {source["snippet"]}' for i, source in enumerate(research.sources)])}

---

**Note:** This is an AI-generated draft based on web research. It requires professional medical review before publication.
**Generated:** {datetime.fromisoformat(research.generated_at).strftime('%Y-%m-%d %H:%M:%S')}
**Word Count:** {research.metadata["word_count"]}
"""
    
    return header + content + sources_section

@app.post("/research/stream")
async def conduct_research_stream(
    request: ResearchRequest,
    authorization: Optional[str] = Header(None)
):
    authenticate(authorization)
    
    return StreamingResponse(
        research_stream_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)