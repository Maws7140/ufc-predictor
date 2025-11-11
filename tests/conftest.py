"""Pytest configuration and shared fixtures."""
import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))


@pytest.fixture
def app():
    """Create Flask app for testing."""
    from app import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def sample_fighters():
    """Sample fighter data for testing."""
    return {
        'fighter1': 'Conor McGregor',
        'fighter2': 'Khabib Nurmagomedov',
        'weight_class': 'Lightweight'
    }
