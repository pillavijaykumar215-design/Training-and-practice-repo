import os
import sys

# Ensure `src` is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic expectations about known activities
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"], dict)


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    test_email = "test.user+pytest@example.com"

    # Ensure the test email is not already registered
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants_before = resp.json()[activity]["participants"]
    if test_email in participants_before:
        # If present for some reason, remove it first
        client.delete(f"/activities/{activity}/unregister?email={test_email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify participant present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants_after = resp.json()[activity]["participants"]
    assert test_email in participants_after

    # Unregister
    resp = client.delete(f"/activities/{activity}/unregister?email={test_email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify removed
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants_final = resp.json()[activity]["participants"]
    assert test_email not in participants_final
