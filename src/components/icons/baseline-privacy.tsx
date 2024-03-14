import type { QwikIntrinsicElements } from "@builder.io/qwik";

export function IcBaselinePrivacyTip(
  props: QwikIntrinsicElements["svg"],
  key: string,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
      key={key}
    >
      <path
        fill="currentColor"
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm-1 6h2v2h-2zm0 4h2v6h-2z"
      ></path>
    </svg>
  );
}
