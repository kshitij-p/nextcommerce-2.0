import { useEffect, useState } from "react";

const useDebounced = <T>(val: T, delayMs: number) => {
  const [debounced, setDebounced] = useState(val);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(val);
    }, delayMs);

    return function cleanup() {
      clearTimeout(timeout);
    };
  }, [val, delayMs]);

  return debounced;
};

export default useDebounced;
