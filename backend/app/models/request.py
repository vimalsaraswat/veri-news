from pydantic import BaseModel, Field, field_validator


class InvestigateRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=15000)
    session_id: str | None = None

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 10:
            raise ValueError("text must be at least 10 characters after stripping whitespace")
        return stripped
