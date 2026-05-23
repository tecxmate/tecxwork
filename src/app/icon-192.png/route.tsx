import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="192"
        height="192"
        viewBox="0 0 512 512"
      >
        <rect width="512" height="512" rx="104" fill="#8C52FF" />
        <rect
          x="132"
          y="190"
          width="248"
          height="192"
          rx="34"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinejoin="round"
        />
        <path
          d="M198 190v-28c0-18 14-32 32-32h52c18 0 32 14 32 32v28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M132 256h248"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M216 286v48"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          d="M296 286v48"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="24"
          strokeLinecap="round"
        />
      </svg>
    ),
    { width: 192, height: 192 }
  );
}
