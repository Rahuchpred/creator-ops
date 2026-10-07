"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { cx } from "@/lib/format";

const pastels = [
  "bg-[#e3edff] text-[#2a54a8]",
  "bg-[#dff5e8] text-[#1c6b47]",
  "bg-[#ffecd6] text-[#94500e]",
  "bg-[#ffe3ef] text-[#a32c63]",
  "bg-[#ebe5ff] text-[#5637b5]",
  "bg-[#fff3c4] text-[#7a5a00]",
];

// The same handle always lands on the same pastel.
const pastelFor = (handle: string) => {
  let sum = 0;
  for (const char of handle) sum = (sum * 31 + char.charCodeAt(0)) % 9973;
  return pastels[sum % pastels.length];
};

// A picture that failed before the page became interactive never fires
// onError, so the ref checks for one that already came back empty.
function usePicture(src: string | undefined) {
  const [broken, setBroken] = useState<string | null>(null);
  const fail = () => setBroken(src ?? null);
  const check = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) fail();
  };
  return { show: Boolean(src) && broken !== src, fail, check };
}

const avatarSize = {
  sm: { box: "size-6 text-[9px]", px: 24 },
  md: { box: "size-9 text-xs", px: 36 },
  lg: { box: "size-14 text-base", px: 56 },
};

// A creator's profile picture over their pastel initials. The initials stay
// underneath, so a missing or broken picture leaves them showing.
export function Avatar({
  handle,
  src,
  size = "md",
}: {
  handle: string;
  src?: string;
  size?: keyof typeof avatarSize;
}) {
  const { show, fail, check } = usePicture(src);
  const { box, px } = avatarSize[size];
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold uppercase",
        box,
        pastelFor(handle),
      )}
    >
      {handle.slice(0, 2)}
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- local files, saved at the size shown
        <img
          ref={check}
          src={src}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          onError={fail}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );
}

// A video's cover image. Without one it is a soft neutral tile. The parent
// sets the shape through className.
export function Cover({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const { show, fail, check } = usePicture(src);
  return (
    <span
      className={cx(
        "relative grid place-items-center overflow-hidden bg-fill text-faint",
        className,
      )}
    >
      <Clapperboard aria-hidden="true" className="size-6 opacity-60" strokeWidth={1.6} />
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- local files, saved at the size shown
        <img
          ref={check}
          src={src}
          alt={alt}
          width={270}
          height={480}
          loading="lazy"
          onError={fail}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );
}
