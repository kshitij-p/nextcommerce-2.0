/* eslint-disable @next/next/no-img-element */
import React from "react";
import Placeholder from "~/../public/placeholder.jpg";

export const Image = React.forwardRef(
  (
    {
      src,
      alt,
      placeholder = Placeholder.src,
      ...rest
    }: React.ComponentPropsWithoutRef<"img"> & {
      placeholder?: string;
    },
    ref: React.ForwardedRef<HTMLImageElement>,
  ) => {
    return <img {...rest} src={src ?? placeholder} alt={alt} ref={ref} />;
  },
);
Image.displayName = "Image";
