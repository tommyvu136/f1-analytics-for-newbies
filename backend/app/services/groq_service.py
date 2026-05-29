from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import datetime, timezone
from functools import partial

from groq import Groq

from app.config import settings

GLOSSARY: list[dict[str, str | None]] = [
    {
        "term": "DRS",
        "definition": "Drag Reduction System — a flap on the rear wing that opens on straights to reduce drag and help overtaking.",
        "example": "When you're within 1 second of the car ahead, DRS gives you a speed boost on the straight.",
    },
    {
        "term": "Undercut",
        "definition": "Pitting before your rival so fresh tyres let you lap faster and gain position when they pit later.",
        "example": "Red Bull undercut Ferrari by pitting two laps early.",
    },
    {
        "term": "Overcut",
        "definition": "Staying out longer on older tyres while rivals pit, hoping your in-lap and out-lap offset their fresh-tyre advantage.",
        "example": "Hamilton overcut by running long on mediums before switching to hards.",
    },
    {
        "term": "Tyre Compound",
        "definition": "The rubber type: Soft (most grip, wears fast), Medium, Hard (durable, less grip). Inter and Wet for rain.",
        "example": "Soft tyres are red, mediums yellow, hards white on the TV graphics.",
    },
    {
        "term": "Pace Gap",
        "definition": "Time difference between two drivers, usually measured to the race leader or car ahead.",
        "example": "+2.5s means you're two and a half seconds behind.",
    },
    {
        "term": "Stint",
        "definition": "A continuous run on one set of tyres between pit stops.",
        "example": "A three-stop race might have four stints per driver.",
    },
    {
        "term": "Sector",
        "definition": "Each lap is split into three timed sections (S1, S2, S3) to compare where time is gained or lost.",
        "example": "Purple sector means fastest time in that section during the session.",
    },
    {
        "term": "Telemetry",
        "definition": "Live data from the car: speed, throttle, braking, gear, and more.",
        "example": "High throttle and low brake on a straight means flat-out acceleration.",
    },
    {
        "term": "Box Box",
        "definition": "Team radio telling the driver to pit this lap.",
        "example": "You'll hear 'box box' when strategy calls for a tyre change.",
    },
    {
        "term": "Graining",
        "definition": "Tyre surface tears and rolls into small balls, reducing grip.",
        "example": "Front-left graining often happens when pushing hard on a cold tyre.",
    },
]


class GroqService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[datetime, str]] = {}

    def _client(self) -> Groq:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured")
        return Groq(api_key=settings.groq_api_key)

    def _cache_key(self, prefix: str, payload: dict) -> str:
        raw = json.dumps(payload, sort_keys=True, default=str)
        digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
        return f"{prefix}:{digest}"

    def _get_cached(self, key: str) -> str | None:
        if key in self._cache:
            ts, text = self._cache[key]
            if (datetime.now(timezone.utc) - ts).total_seconds() < settings.llm_cache_ttl_seconds:
                return text
        return None

    def _set_cached(self, key: str, text: str) -> None:
        self._cache[key] = (datetime.now(timezone.utc), text)

    def _complete(self, system: str, user: str) -> str:
        client = self._client()
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
            max_tokens=800,
        )
        return response.choices[0].message.content or ""

    async def _complete_async(self, system: str, user: str) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._complete, system, user))

    async def explain_telemetry(self, summary: dict, event_name: str) -> tuple[str, bool]:
        key = self._cache_key("telemetry", summary)
        cached = self._get_cached(key)
        if cached:
            return cached, True
        system = (
            "You explain Formula 1 telemetry to complete beginners. "
            "Use simple words, short paragraphs, and avoid jargon unless you define it. "
            "Focus on what the driver was doing: braking, accelerating, and lap speed. "
            "Be encouraging and factual. Max 150 words."
        )
        user = (
            f"Race: {event_name}\n"
            f"Telemetry summary (JSON):\n{json.dumps(summary, indent=2)}\n\n"
            "Explain what this lap tells a newbie about how the driver drove."
        )
        text = await self._complete_async(system, user)
        self._set_cached(key, text)
        return text, False

    async def explain_pace_gap(self, summary: dict, event_name: str) -> tuple[str, bool]:
        key = self._cache_key("pace_gap", summary)
        cached = self._get_cached(key)
        if cached:
            return cached, True
        system = (
            "You explain Formula 1 race pace gaps to complete beginners. "
            "Explain why the gap might have opened or closed in plain language. "
            "Mention tyres, pit stops, or pace only if the data suggests it. "
            "Max 150 words. No jargon without explanation."
        )
        user = (
            f"Race: {event_name}\n"
            f"Pace gap summary (JSON):\n{json.dumps(summary, indent=2)}\n\n"
            "Explain what happened with this driver's gap during the race."
        )
        text = await self._complete_async(system, user)
        self._set_cached(key, text)
        return text, False

    async def ask(self, question: str) -> tuple[str, bool]:
        key = self._cache_key("ask", {"q": question.lower().strip()})
        cached = self._get_cached(key)
        if cached:
            return cached, True
        system = (
            "You are a friendly F1 tutor for absolute beginners on the site 'F1 Analytics for Noobs'. "
            "Answer questions simply and accurately. Use analogies when helpful. Max 200 words."
        )
        text = await self._complete_async(system, question)
        self._set_cached(key, text)
        return text, False

    def get_glossary(self) -> list[dict[str, str | None]]:
        return GLOSSARY


groq_service = GroqService()
