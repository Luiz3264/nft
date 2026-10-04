import { delay, HttpResponse } from "msw";
import type { MockScenario } from "@/api/contracts";
import { mockStore } from "./state";

let requestSequence = 0;

export function resetScenarioTiming() {
  requestSequence = 0;
}

export async function applyScenarioLatency() {
  const scenario = mockStore.scenario;
  if (scenario === "variable-latency" || scenario === "out-of-order") {
    const sequence = requestSequence++;
    const durations =
      scenario === "out-of-order" ? [700, 70, 350] : [120, 650, 240, 480];
    await delay(durations[sequence % durations.length]);
  }
}

export function scenarioFailure(): Response | undefined {
  const scenario = mockStore.scenario;
  if (scenario === "offline") return HttpResponse.error();
  if (scenario === "http-4xx")
    return HttpResponse.json(
      {
        code: "MOCK_BAD_REQUEST",
        message: "Falha HTTP 400 configurada pelo cenário.",
      },
      { status: 400 },
    );
  if (scenario === "http-5xx")
    return HttpResponse.json(
      {
        code: "MOCK_UNAVAILABLE",
        message: "Falha HTTP 503 configurada pelo cenário.",
      },
      { status: 503 },
    );
  return undefined;
}

export function isMockScenario(value: unknown): value is MockScenario {
  return (
    typeof value === "string" &&
    [
      "success",
      "empty",
      "variable-latency",
      "out-of-order",
      "offline",
      "http-4xx",
      "http-5xx",
      "session-expired",
      "unauthorized",
      "registration-conflict",
      "form-validation",
      "coupon-invalid",
      "coupon-expired",
      "price-changed",
      "edition-sold-out",
      "order-timeout",
      "payment-confirmed",
      "payment-declined",
    ].includes(value)
  );
}
