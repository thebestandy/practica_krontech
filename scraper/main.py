from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("mongo")
    # await connect_to_mongo()
    yield
    print("inchizi mongo")


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


app.include_router()


@app.get("/")
def root():
    return {"message": "workign"}
