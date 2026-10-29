import os

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from pragya_ai import PragyaAI

app = FastAPI(title="PRAGYA AI", version="1.0.0")
assistant = PragyaAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "name": "PRAGYA AI"}


@app.post("/chat")
def chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    reply = assistant.respond(request.message)
    return {"reply": reply}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
