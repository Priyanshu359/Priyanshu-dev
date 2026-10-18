# Profile Module

## Responsibilities
The `profile` module serves developer metadata and API identity:
1. **Source of Truth**: Loads developer background, stack, and contact links directly from `content/site/profile.yaml`.
2. **Caching**: Caches the parsed JSON representation in Redis (`profile:me`) with fallback to local memory.
3. **Adaptive Formatting**:
   - `curl`, `wget`, and CLI clients receive compact, single-line JSON designed for terminal pipes and `jq`.
   - Web browsers and GUI clients receive indented, pretty-printed JSON.
4. **Endpoint**: `GET /me` (no `/api` prefix, served directly on root API domain).
