"""Network helpers for cloud deploy (Railway, etc.)."""

import socket

_patched = False


def prefer_ipv4_dns() -> None:
    """Prefer IPv4 when resolving hostnames.

    Railway containers often lack working IPv6 routes to external APIs,
    causing OSError: [Errno 101] Network is unreachable via uvloop/async connect.
    """
    global _patched
    if _patched:
        return

    original_getaddrinfo = socket.getaddrinfo

    def ipv4_getaddrinfo(
        host: str,
        port: str | int | None,
        family: int = 0,
        type: int = 0,
        proto: int = 0,
        flags: int = 0,
    ):
        return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

    socket.getaddrinfo = ipv4_getaddrinfo  # type: ignore[assignment]
    _patched = True
