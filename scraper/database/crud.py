from .connection import nodes_collection, links_collection
from ..models.schemas import Node, Link
from typing import List

# utils pt inserare date


async def insert_graph_data(nodes: List[Node], links: List[Link]):
    await nodes_collection.delete_many({})
    await links_collection.delete_many({})

    nodes_dict = [node.model_dump() for node in nodes]
    links_dict = [link.model_dump() for link in links]

    if nodes_dict:
        await nodes_collection.insert_many(nodes_dict)
    if links_dict:
        await links_collection.insert_many(links_dict)


async def get_entire_graph():
    nodes = await nodes_collection.find({}, {"_id": 0}).to_list(length=None)
    links = await links_collection.find({}, {"_id": 0}).to_list(length=None)

    return {"nodes": nodes, "links": links}
