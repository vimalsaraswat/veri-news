from __future__ import annotations


def extract_text(response) -> str:
    """
    Normalize an LLM response to a plain string.

    Newer Gemini models (e.g. gemini-3.x) return content as a list of
    typed blocks: [{'type': 'text', 'text': '...', 'extras': {...}}].
    Older models and most others return a plain str. Handle both.
    """
    content = response.content if hasattr(response, "content") else response
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in content
        )
    return str(content)
