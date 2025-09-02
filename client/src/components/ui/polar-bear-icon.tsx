import React from "react";
import { cn } from "@/lib/utils";

export function PolarBearIcon({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-6", className)}
    >
      <g>
        {/* Body */}
        <path
          d="M25 20.5C25 25.1944 21.1944 29 16.5 29C11.8056 29 8 25.1944 8 20.5C8 15.8056 11.8056 12 16.5 12C21.1944 12 25 15.8056 25 20.5Z"
          fill="currentColor"
        />
        {/* Head */}
        <path
          d="M24 11C24 14.3137 21.3137 17 18 17C14.6863 17 12 14.3137 12 11C12 7.68629 14.6863 5 18 5C21.3137 5 24 7.68629 24 11Z"
          fill="currentColor"
        />
        {/* Left ear */}
        <circle cx="13" cy="7" r="2" fill="currentColor" />
        {/* Right ear */}
        <circle cx="23" cy="7" r="2" fill="currentColor" />
        {/* Left arm */}
        <path
          d="M12 20C10.8954 19 9.5 19.5 9 20C8.5 20.5 7 23 8 24C9 25 11 24 12 22"
          fill="currentColor"
        />
        {/* Right arm */}
        <path
          d="M21 20C22.1046 19 23.5 19.5 24 20C24.5 20.5 26 23 25 24C24 25 22 24 21 22"
          fill="currentColor"
        />
        {/* Snout */}
        <ellipse cx="18" cy="13" rx="3" ry="2.5" fill="currentColor" />
        {/* Left eye */}
        <circle cx="16" cy="10" r="1" fill="black" />
        {/* Right eye */}
        <circle cx="20" cy="10" r="1" fill="black" />
        {/* Nose */}
        <ellipse cx="18" cy="12" rx="1" ry="0.75" fill="black" />
      </g>
    </svg>
  );
}

export function PolarBearWavingIcon({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      <g>
        {/* Body */}
        <path
          d="M25 20.5C25 25.1944 21.1944 29 16.5 29C11.8056 29 8 25.1944 8 20.5C8 15.8056 11.8056 12 16.5 12C21.1944 12 25 15.8056 25 20.5Z"
          fill="currentColor"
        />
        {/* Head */}
        <path
          d="M24 11C24 14.3137 21.3137 17 18 17C14.6863 17 12 14.3137 12 11C12 7.68629 14.6863 5 18 5C21.3137 5 24 7.68629 24 11Z"
          fill="currentColor"
        />
        {/* Left ear */}
        <circle cx="13" cy="7" r="2" fill="currentColor" />
        {/* Right ear */}
        <circle cx="23" cy="7" r="2" fill="currentColor" />
        {/* Left arm - waving */}
        <path
          d="M12 16C10.8954 15 8.5 12.5 8 13C7.5 13.5 7 15 8 16C9 17 11 16 12 16"
          fill="currentColor"
        />
        {/* Right arm */}
        <path
          d="M21 20C22.1046 19 23.5 19.5 24 20C24.5 20.5 26 23 25 24C24 25 22 24 21 22"
          fill="currentColor"
        />
        {/* Snout */}
        <ellipse cx="18" cy="13" rx="3" ry="2.5" fill="currentColor" />
        {/* Left eye */}
        <circle cx="16" cy="10" r="1" fill="black" />
        {/* Right eye */}
        <circle cx="20" cy="10" r="1" fill="black" />
        {/* Nose */}
        <ellipse cx="18" cy="12" rx="1" ry="0.75" fill="black" />
        {/* Happy mouth */}
        <path
          d="M17 14C17.5 14.5 18.5 14.5 19 14"
          stroke="black"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}