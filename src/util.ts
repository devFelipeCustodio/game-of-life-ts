export async function sleep(t: number) {
  return await new Promise((resolve) => setTimeout(resolve, t));
}

export function debounce<T extends (...args: unknown[]) => void>(
  wait: number,
  callback: T,
) {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function <U>(this: U, ...args: Parameters<typeof callback>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (typeof timeout === 'number') {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      callback.apply(context, args);
    }, wait);

    if (!timeout) {
      callback.apply(context, args);
    }
  };
}
