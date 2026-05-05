from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime


class NodeType(str, Enum):
    PERSON = "Persoana"
    COMPANY = "Companie"
    COURT_CASE = "CourtCase"
    DOCUMENT = "Document"
    SOCIAL_PROFILE = "SocialProfile"
    MEDIA = "Media"
    EVENT = "Event"
    LOCATION = "Location"


class Node(BaseModel):
    id: str = Field(..., description="id unic")
    type: NodeType
    label: str = Field(..., description="nume persoana, nume companie etc")
    summary: Optional[str] = None
    url: Optional[str] = "N/A"

    properties: Optional[Dict[str, Any]] = Field(
        default_factory=dict
    )  # cv optional sa dati dump la tot data-ul pe care il obtinueti daca nu se incadreaza in alte categorii

    created_at: datetime = Field(default_factory=datetime.now())


class Link(BaseModel):
    source: str = Field(..., description="node id")
    target: str = Field(..., description="node id")
    label: str = Field(..., description="relation ship")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="probabilitate de potrivire pentru datele extrase",
    )

    extracted_from: Optional[str] = Field(
        None, description="de ex demoanaf_api portal_just"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GraphPayload(BaseModel):
    nodes: List[Node]
    links: List[Link]
