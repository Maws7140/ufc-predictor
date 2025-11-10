"""API endpoint tests."""
import pytest
import json


class TestHealthEndpoint:
    """Test health check endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns 200."""
        response = client.get('/')
        assert response.status_code == 200


class TestPredictionEndpoint:
    """Test prediction endpoint."""

    def test_predict_missing_data(self, client):
        """Test prediction with missing fighter data."""
        response = client.post('/predict',
                               data=json.dumps({}),
                               content_type='application/json')
        assert response.status_code == 400

    def test_predict_invalid_fighter(self, client):
        """Test prediction with invalid fighter name."""
        response = client.post('/predict',
                               data=json.dumps({
                                   'fighter1': 'NonExistentFighter123',
                                   'fighter2': 'AnotherFakeFighter456',
                                   'weight_class': 'Lightweight'
                               }),
                               content_type='application/json')
        assert response.status_code in [400, 404]

    def test_predict_same_fighter(self, client):
        """Test prediction with same fighter twice."""
        response = client.post('/predict',
                               data=json.dumps({
                                   'fighter1': 'Conor McGregor',
                                   'fighter2': 'Conor McGregor',
                                   'weight_class': 'Lightweight'
                               }),
                               content_type='application/json')
        assert response.status_code == 400


class TestFighterEndpoints:
    """Test fighter-related endpoints."""

    def test_get_all_fighters(self, client):
        """Test getting all fighters."""
        response = client.get('/fighters')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'fighters' in data
        assert isinstance(data['fighters'], list)
        assert len(data['fighters']) > 0

    def test_get_fighters_by_weight_class(self, client):
        """Test getting fighters filtered by weight class."""
        response = client.get('/fighters-by-weight-class/Lightweight')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'fighters' in data
        assert isinstance(data['fighters'], list)

    def test_get_weight_classes(self, client):
        """Test getting all weight classes."""
        response = client.get('/weight-classes')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'weight_classes' in data
        assert isinstance(data['weight_classes'], list)
        assert len(data['weight_classes']) > 0

    def test_get_fighter_weight_classes(self, client):
        """Test getting weight classes for specific fighter."""
        response = client.get('/fighter-weight-classes/Conor McGregor')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'weight_classes' in data
        assert isinstance(data['weight_classes'], list)


class TestCORS:
    """Test CORS configuration."""

    def test_cors_headers(self, client):
        """Test CORS headers are present."""
        response = client.options('/predict')
        assert 'Access-Control-Allow-Origin' in response.headers
