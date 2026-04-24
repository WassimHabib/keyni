import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("APP_URL", "http://localhost:3000");
vi.stubEnv(
  "SESSION_SECRET",
  "test-session-secret-32chars-minimum-1234567890",
);
vi.stubEnv("EMAIL_PROVIDER", "console");
