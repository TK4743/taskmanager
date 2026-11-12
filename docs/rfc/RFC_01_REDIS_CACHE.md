# RFC-01: Redis TTL Caching Layer

- Cache Strategy: Write-through with 900s TTL
- Benchmarked Latency: 18ms (cached) vs 410ms (upstream)
- Target: Mitigate LeetCode upstream rate-limits