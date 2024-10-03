import { init } from "@paralleldrive/cuid2";

export const createCuidGenerator = () => {
  return init({
    length: 25,
  });
};
const globalForCuid = globalThis as unknown as {
  cuid: ReturnType<typeof createCuidGenerator> | undefined;
};

export const cuid = globalForCuid.cuid ?? createCuidGenerator();
