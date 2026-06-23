import socket

from app.network import prefer_ipv4_dns


def test_prefer_ipv4_dns_patches_getaddrinfo(monkeypatch) -> None:
    calls: list[int] = []

    def fake_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        calls.append(family)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    import app.network as network_module

    network_module._patched = False

    prefer_ipv4_dns()
    socket.getaddrinfo("example.com", 443)

    assert calls == [socket.AF_INET]
