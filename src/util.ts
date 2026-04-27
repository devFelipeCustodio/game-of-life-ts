export async function sleep(t: number) {
  return await new Promise((resolve) => setTimeout(resolve, t));
}

export function debounce<T extends (...args: unknown[]) => void>(
  wait: number,
  callback: T,
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback.apply(this, args);
    }, wait);
  };
}
