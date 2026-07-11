"""
In-memory cache for session validity checks.

The auth middleware runs on every request and would otherwise open its own
DB connection per request just to check whether a session is revoked —
competing with route handlers for Supabase's limited pooled connections and
causing multi-second stalls under the burst of parallel requests a single
page load fires. Caching valid (jti -> user_id) pairs for a short TTL means
only the first request in a burst hits the DB; the rest are served from
memory. Revoking a session evicts it immediately so logout/revoke still
take effect right away.
"""
import datetime as dt
import uuid

_TTL = dt.timedelta(seconds=30)
_cache: dict[uuid.UUID, tuple[uuid.UUID, dt.datetime]] = {}


def get_cached_user_id(jti: uuid.UUID) -> uuid.UUID | None:
    entry = _cache.get(jti)
    if not entry:
        return None
    user_id, cached_at = entry
    if dt.datetime.now(dt.timezone.utc) - cached_at > _TTL:
        _cache.pop(jti, None)
        return None
    return user_id


def cache_session(jti: uuid.UUID, user_id: uuid.UUID) -> None:
    _cache[jti] = (user_id, dt.datetime.now(dt.timezone.utc))


def evict_session(jti: uuid.UUID) -> None:
    _cache.pop(jti, None)
