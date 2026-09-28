from typing import Any

import httpx

from app.core.logging import logger

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class ExpoPushService:
    async def send(self, tokens: list[str], title: str, body: str, data: dict[str, Any]) -> int:
        valid_tokens = [token for token in dict.fromkeys(tokens) if token.startswith(("ExpoPushToken[", "ExponentPushToken["))]
        accepted = 0
        async with httpx.AsyncClient(timeout=15.0) as client:
            for index in range(0, len(valid_tokens), 100):
                messages = [{"to": token, "title": title, "body": body, "data": data, "sound": "default", "priority": "high", "channelId": "emergency-alerts", "categoryId": "sos-alert"} for token in valid_tokens[index:index + 100]]
                try:
                    response = await client.post(EXPO_PUSH_URL, json=messages, headers={"Accept": "application/json", "Accept-Encoding": "gzip, deflate"})
                    response.raise_for_status()
                    tickets = response.json().get("data", [])
                    accepted += sum(1 for ticket in tickets if ticket.get("status") == "ok")
                except (httpx.HTTPError, ValueError) as exc:
                    logger.error("Expo push delivery request failed: %s", exc)
        return accepted


expo_push_service = ExpoPushService()
