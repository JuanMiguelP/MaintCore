"""Tests unitarios para NotificationService."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date, datetime

from app.infrastructure.notifications.notification_service import NotificationService


class TestNotificationServiceAntiSpam:
    """Pruebas de lógica anti-spam."""

    @pytest.mark.asyncio
    async def test_low_stock_only_on_threshold_crossing(self):
        """LOW_STOCK solo se envía cuando cruza el umbral (6→5), no por permanecer (5→4)."""
        service = NotificationService()
        part = MagicMock()
        part.id = "test-part-id"
        part.name = "Test Part"
        part.part_number = "TP-001"
        part.minimum_stock = 5
        part.supplier_id = None

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=AsyncMock(scalar_one_or_none=None))
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Primera llamada: 6→5 (debe enviar)
        part.current_stock = 6
        result1 = await service.check_and_notify_low_stock(mock_db, part)
        assert result1 is True

        # Segunda llamada: 5→4 (NO debe enviar)
        part.current_stock = 5
        result2 = await service.check_and_notify_low_stock(mock_db, part)
        assert result2 is False

    @pytest.mark.asyncio
    async def test_out_of_stock_only_on_zero_crossing(self):
        """OUT_OF_STOCK solo se envía cuando llega a cero (1→0)."""
        service = NotificationService()
        part = MagicMock()
        part.id = "test-part-id"
        part.name = "Test Part"
        part.part_number = "TP-001"
        part.minimum_stock = 5
        part.supplier_id = None

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=AsyncMock(scalar_one_or_none=None))
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # 2→1 (NO debe enviar)
        part.current_stock = 2
        result1 = await service.check_and_notify_low_stock(mock_db, part)
        assert result1 is False

        # 1→0 (DEBE enviar)
        part.current_stock = 0
        result2 = await service.check_and_notify_low_stock(mock_db, part)
        assert result2 is True

    @pytest.mark.asyncio
    async def test_no_spam_for_same_state(self):
        """No enviar emails repetidos por el mismo estado."""
        service = NotificationService()
        part = MagicMock()
        part.id = "test-part-id"
        part.name = "Test Part"
        part.part_number = "TP-001"
        part.minimum_stock = 5
        part.supplier_id = None

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=AsyncMock(scalar_one_or_none=None))
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # 5→5 (mismo estado, NO debe enviar después del primero)
        part.current_stock = 5
        result1 = await service.check_and_notify_low_stock(mock_db, part)
        result2 = await service.check_and_notify_low_stock(mock_db, part)
        result3 = await service.check_and_notify_low_stock(mock_db, part)

        assert result1 is True  # Primer cruce
        assert result2 is False  # Mismo estado
        assert result3 is False  # Mismo estado
