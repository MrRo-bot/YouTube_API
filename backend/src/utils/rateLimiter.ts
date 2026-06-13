import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limiting each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Returning rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disabling the `X-RateLimit-*` headers
  ipv6Subnet: 56, // 60 or 64 - less aggressive, 52 or 48 - aggressive
});

export default limiter;
