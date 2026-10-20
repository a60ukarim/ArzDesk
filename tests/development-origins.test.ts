import { expect, it } from "vitest";
import { developmentOrigins } from "@/lib/development-origins";
it("allows only the configured development origin and same-port loopback origins", () => {
  const origins = developmentOrigins(
    "http://192.168.1.8:3000/path",
    "development",
  );
  expect(origins).toEqual([
    "http://192.168.1.8:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  expect(origins).not.toContain("http://192.168.1.9:3000");
  expect(origins).not.toContain("http://192.168.1.8:4000");
});
it("never adds development origins during build, tests or production", () => {
  for (const mode of ["production", "test", undefined])
    expect(developmentOrigins("http://192.168.1.8:3000", mode)).toEqual([]);
  expect(developmentOrigins(undefined, "development")).toEqual([]);
});
