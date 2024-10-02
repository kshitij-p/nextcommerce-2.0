"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm as usePrimitiveForm,
  type UseFormProps,
} from "react-hook-form";
import { type TypeOf } from "zod";

export const useForm = <Z extends Zod.Schema>({
  schema,
  ...rest
}: Exclude<UseFormProps<TypeOf<Z>>, "resolver"> & {
  schema: Z;
}) => {
  return usePrimitiveForm({ ...rest, resolver: zodResolver(schema) });
};
