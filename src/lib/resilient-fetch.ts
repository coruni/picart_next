const RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRY_COUNT = 2;
const RETRY_DELAY_MS = 400;

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return "GET";
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function shouldRetry(method: string, attempt: number) {
  return RETRYABLE_METHODS.has(method) && attempt < DEFAULT_RETRY_COUNT;
}

function createRetryDelay(attempt: number) {
  return RETRY_DELAY_MS * 2 ** attempt;
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof DOMException
      ? error.name === "TimeoutError"
      : error instanceof Error && error.name === "TimeoutError"
  );
}

function createTimeoutController(
  signal?: AbortSignal | null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const abortFromParent = () => {
    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", abortFromParent, { once: true });
    }
  }

  if (!controller.signal.aborted && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("Request timeout", "TimeoutError"));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      signal?.removeEventListener("abort", abortFromParent);
    },
    didTimeout: () => timedOut,
  };
}

async function sleep(ms: number, signal?: AbortSignal | null) {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createFallbackResponse(input: RequestInfo | URL, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Upstream request failed";

  return new Response(
    JSON.stringify({
      message,
      url: getRequestUrl(input),
      fallback: true,
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "X-Resilient-Fetch": "fallback",
      },
    },
  );
}

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = getRequestMethod(input, init);
  const requestUrl = getRequestUrl(input);
  let lastError: unknown;

  for (let attempt = 0; attempt <= DEFAULT_RETRY_COUNT; attempt += 1) {
    const timeoutController = createTimeoutController(init?.signal);

    try {
      const response = await fetch(input, {
        ...init,
        signal: timeoutController.signal,
      });

      timeoutController.cleanup();

      if (
        shouldRetry(method, attempt) &&
        RETRYABLE_STATUS_CODES.has(response.status)
      ) {
        await sleep(createRetryDelay(attempt), init?.signal);
        continue;
      }

      return response;
    } catch (error) {
      timeoutController.cleanup();
      lastError = error;

      const abortedByCaller = init?.signal?.aborted;
      const retryableNetworkError =
        timeoutController.didTimeout() ||
        isTimeoutError(error) ||
        (!abortedByCaller && !isAbortError(error));

      if (shouldRetry(method, attempt) && retryableNetworkError) {
        await sleep(createRetryDelay(attempt), init?.signal);
        continue;
      }

      if (abortedByCaller || isAbortError(error)) {
        throw error;
      }

      console.error("[network] request failed after retries", {
        method,
        requestUrl,
        attempt,
        error,
      });

      return createFallbackResponse(input, error);
    }
  }

  console.error("[network] request failed after exhausting retries", {
    method,
    requestUrl,
    error: lastError,
  });

  return createFallbackResponse(input, lastError);
}
