from fastapi import APIRouter, HTTPException
from models.schemas import RAGChatRequest, RAGChatResponse
from services.rag_service import rag_service

router = APIRouter()

@router.post("", response_model=RAGChatResponse, summary="Chat with Grounded RAG AI Financial Analyst")
async def chat_with_analyst(request: RAGChatRequest):
    try:
        res = await rag_service.answer_query(
            ticker=request.ticker,
            query=request.query,
            history=request.history
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Analyst error: {str(e)}")
