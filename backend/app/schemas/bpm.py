from typing import Literal
from pydantic import BaseModel


RPPGStatus = Literal[
    "estimating",
    "no_face",
    "normal",
    "brady",
    "tachy",
    "critical_low",
    "critical_high",
]


class BBoxSchema(BaseModel):
    x: int
    y: int
    w: int
    h: int


class BPMResponse(BaseModel):
    bpm: float
    signal: list[float]
    status: RPPGStatus
    bbox: BBoxSchema | None
    ready: bool