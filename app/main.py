from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ask import router as ask_router
from routes.quiz import router as quiz_router
from routes.progress import router as progress_router
from routes.pdf import router as pdf_router

app = FastAPI(
    title="LearnMate AI",
    description="Adaptive Learning Companion with Memento-style memory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask_router)
app.include_router(quiz_router)
app.include_router(progress_router)
app.include_router(pdf_router)


@app.get("/")
def home():
    return {"message": "LearnMate AI running", "version": "1.0.0"}