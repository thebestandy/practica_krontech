from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://mongodb:27017"
client = AsyncIOMotorClient(MONGO_URL)

db = client.scraper_db

nodes_collection = db.get_collection("nodes")
links_collection = db.get_collection("links")


mock_nodes_collection = db.get_collection("mock_nodes")
mock_links_collection = db.get_collection("mock_links")
