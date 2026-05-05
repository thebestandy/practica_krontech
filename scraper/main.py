from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from api.websockets import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("setting up mongo")
    # aici pornim mongo
    yield
    print("inchid mongo")
    # aici trb oprit


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket_router)


@app.get("/")
def root():
    return {"message": "workign"}
