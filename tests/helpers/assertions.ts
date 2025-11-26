/**
 * Custom assertions and matchers for testing
 */

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Assert that an array has a specific length
 */
export function assertLength<T>(
  array: T[],
  expectedLength: number,
  message?: string
): void {
  if (array.length !== expectedLength) {
    throw new Error(
      message ||
        `Expected array to have length ${expectedLength}, but got ${array.length}`
    );
  }
}

/**
 * Assert that a promise rejects with a specific error type
 */
export async function assertRejects<T extends Error>(
  promise: Promise<any>,
  errorType: new (...args: any[]) => T,
  messageContains?: string
): Promise<void> {
  try {
    await promise;
    throw new Error(
      `Expected promise to reject with ${errorType.name}, but it resolved`
    );
  } catch (error) {
    if (!(error instanceof errorType)) {
      throw new Error(
        `Expected error to be instance of ${errorType.name}, but got ${
          error instanceof Error ? error.constructor.name : typeof error
        }`
      );
    }

    if (messageContains && !error.message.includes(messageContains)) {
      throw new Error(
        `Expected error message to contain "${messageContains}", but got "${error.message}"`
      );
    }
  }
}

/**
 * Assert that an object has specific properties
 */
export function assertHasProperties<T extends object>(
  obj: T,
  properties: (keyof T)[],
  message?: string
): void {
  for (const prop of properties) {
    if (!(prop in obj)) {
      throw new Error(
        message || `Expected object to have property "${String(prop)}"`
      );
    }
  }
}

/**
 * Assert that a function is called with specific arguments
 */
export function assertCalledWith(
  mockFn: jest.Mock,
  ...expectedArgs: any[]
): void {
  const calls = mockFn.mock.calls;
  const match = calls.some((call) =>
    expectedArgs.every((arg, index) => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(call[index]) === JSON.stringify(arg);
      }
      return call[index] === arg;
    })
  );

  if (!match) {
    throw new Error(
      `Expected function to be called with ${JSON.stringify(
        expectedArgs
      )}, but it was called with:\n${calls
        .map((c) => JSON.stringify(c))
        .join('\n')}`
    );
  }
}
