from pydantic import BaseModel, Field


class TextAsk(BaseModel):
    text: str
    language: str = Field(default="en")


class SpeakAsk(BaseModel):
    text: str
    language: str = Field(default="en")
