from app.security import hash_api_key


def test_hash_api_key_is_deterministic() -> None:
    first = hash_api_key("test-api-key")
    second = hash_api_key("test-api-key")
    assert first == second
    assert len(first) == 64


def test_hash_api_key_differs_for_different_keys() -> None:
    assert hash_api_key("key-a") != hash_api_key("key-b")
