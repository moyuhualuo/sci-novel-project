import base64
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_email_verification_token
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_healthcheck(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_sets_cookie(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@scifi.local", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200
    assert "scifi_session" in response.cookies


def test_register_verify_and_login_editor_account(client: TestClient) -> None:
    email = f"editor-{uuid4().hex[:8]}@example.com"
    password = "GalaxyPass123!"

    register = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Nova Editor",
            "email": email,
            "password": password,
        },
    )
    assert register.status_code == 201
    assert register.json()["verification_required"] is True

    denied_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert denied_login.status_code == 403
    assert denied_login.json()["detail"] == "Email not verified"

    token = create_email_verification_token(email)
    verify = client.get(f"/api/v1/auth/verify-email?token={token}", follow_redirects=False)
    assert verify.status_code == 307
    assert "verified=success" in verify.headers["location"]

    approved_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert approved_login.status_code == 200
    assert approved_login.json()["verified"] is True

    editor_content = client.get("/api/v1/admin/content")
    assert editor_content.status_code == 200


def test_public_site_returns_bilingual_sections_and_logs(client: TestClient) -> None:
    response = client.get("/api/v1/site")
    assert response.status_code == 200
    body = response.json()
    assert len(body["sections"]) >= 1
    assert len(body["change_logs"]) >= 1
    assert "en" in body["site_title"]
    assert "zh" in body["site_title"]


def test_admin_content_crud_and_logs(client: TestClient) -> None:
    unauthorized = client.get("/api/v1/admin/content")
    assert unauthorized.status_code == 401

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@scifi.local", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200

    authorized = client.get("/api/v1/admin/content")
    assert authorized.status_code == 200
    assert "sections" in authorized.json()

    update_site_profile = client.put(
        "/api/v1/admin/site-profile",
        json={
            "site_title": {"en": "Sci-Fi Novel Introduction", "zh": "\u79d1\u5e7b\u5c0f\u8bf4\u4ecb\u7ecd"},
            "tagline": {
                "en": "A polished sci-fi archive with editable story intros.",
                "zh": "\u4e00\u4e2a\u53ef\u76f4\u63a5\u7f16\u8f91\u7ad9\u70b9\u4ecb\u7ecd\u7684\u79d1\u5e7b\u5c0f\u8bf4\u7ad9\u70b9\u3002",
            },
            "intro": {
                "en": "Browse sections from the edge-pinned sidebar and edit the homepage intro after login.",
                "zh": "\u4ece\u8d34\u8fb9\u4fa7\u8fb9\u680f\u6d4f\u89c8\u5404\u4e2a\u677f\u5757\uff0c\u767b\u5f55\u540e\u53ef\u76f4\u63a5\u4fee\u6539\u9996\u9875\u4ecb\u7ecd\u3002",
            },
        },
    )
    assert update_site_profile.status_code == 200
    assert update_site_profile.json()["intro"]["en"].startswith("Browse sections")

    suffix = uuid4().hex[:8]
    create_section = client.post(
        "/api/v1/admin/sections",
        json={
            "slug": f"test-section-{suffix}",
            "title": {"en": f"Test Section {suffix}", "zh": "\u6d4b\u8bd5\u677f\u5757"},
            "summary": {"en": "Used for CRUD verification.", "zh": "\u7528\u4e8e CRUD \u9a8c\u8bc1\u3002"},
            "position": 99,
        },
    )
    assert create_section.status_code == 201
    section_id = create_section.json()["id"]

    create_block = client.post(
        f"/api/v1/admin/sections/{section_id}/blocks",
        json={
            "title": {"en": "Draft Paragraph", "zh": "\u6587\u672c\u8349\u7a3f"},
            "kind": "text",
            "content": {"en": "This is a text block.", "zh": "\u8fd9\u662f\u4e00\u6bb5\u6587\u672c\u3002"},
            "image_url": "",
            "position": 1,
        },
    )
    assert create_block.status_code == 201
    block_id = create_block.json()["id"]

    upload_image = client.post(
        "/api/v1/admin/uploads/images",
        json={
            "filename": "poster.png",
            "content_type": "image/png",
            "data_base64": base64.b64encode(b"fake-image-bytes").decode("ascii"),
        },
    )
    assert upload_image.status_code == 201
    uploaded_url = upload_image.json()["url"]
    assert "/uploads/" in uploaded_url

    update_block = client.put(
        f"/api/v1/admin/blocks/{block_id}",
        json={
            "title": {"en": "Poster Image", "zh": "\u6d77\u62a5\u56fe\u7247"},
            "kind": "image",
            "content": {"en": "Inserted a poster image.", "zh": "\u63d2\u5165\u4e86\u4e00\u5f20\u6d77\u62a5\u56fe\u3002"},
            "image_url": uploaded_url,
            "position": 1,
        },
    )
    assert update_block.status_code == 200

    logs = client.get("/api/v1/admin/logs")
    assert logs.status_code == 200
    assert any(entry["section_title"]["en"].startswith("Test Section") for entry in logs.json()["entries"])

    delete_block = client.delete(f"/api/v1/admin/blocks/{block_id}")
    assert delete_block.status_code == 200

    delete_section = client.delete(f"/api/v1/admin/sections/{section_id}")
    assert delete_section.status_code == 200
