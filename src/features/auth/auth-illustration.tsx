import { type AuthView } from "./auth-shell";

/* Four separate scenes; their geometry stays crisp in both appearances. */
export function AuthIllustration({ view }: { view: AuthView }) {
  return (
    <svg viewBox="0 0 480 340" fill="none" data-illustration={view}>
      <defs>
        <pattern
          id={`dots-${view}`}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity=".14" />
        </pattern>
        <linearGradient
          id={`glow-${view}`}
          x1="80"
          y1="40"
          x2="400"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary)" stopOpacity=".26" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity=".02" />
        </linearGradient>
      </defs>
      <rect width="480" height="340" fill={`url(#dots-${view})`} />
      {view === "sign-in" && (
        <>
          <circle cx="242" cy="172" r="135" fill={`url(#glow-${view})`} />
          <path
            d="M57 293H427M82 279H395"
            stroke="currentColor"
            opacity=".14"
          />
          <path
            d="M153 282V103a88 88 0 0 1 176 0v179"
            fill="var(--surface)"
            stroke="var(--primary)"
            strokeWidth="3"
          />
          <path
            d="M176 282V107a65 65 0 0 1 130 0v175"
            fill={`url(#glow-${view})`}
          />
          <path
            d="m176 282 82-32V66l-82 37Z"
            fill="var(--primary)"
            opacity=".83"
          />
          <circle cx="237" cy="177" r="5" fill="var(--surface)" />
          <path
            d="M281 203h100m-20-20 20 20-20 20"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="73"
            y="119"
            width="66"
            height="70"
            rx="16"
            fill="var(--surface)"
            transform="rotate(-12 106 154)"
          />
          <path
            d="m89 151 12 12 23-27"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="366" cy="94" r="8" fill="var(--primary)" opacity=".4" />
          <path
            d="m113 240 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z"
            fill="var(--primary)"
            opacity=".5"
          />
        </>
      )}
      {view === "sign-up" && (
        <>
          <ellipse
            cx="242"
            cy="277"
            rx="164"
            ry="32"
            fill={`url(#glow-${view})`}
          />
          <path
            d="M71 267 238 319l173-58"
            stroke="var(--primary)"
            opacity=".2"
            strokeDasharray="5 7"
          />
          <path
            d="m89 170 104-46 102 46-104 49Z"
            fill="var(--primary)"
            opacity=".65"
          />
          <path
            d="M89 170v67l102 49v-67Zm102 49v67l104-49v-67"
            fill="var(--primary)"
            opacity=".24"
          />
          <path d="m218 119 77-35 79 35-79 36Z" fill="var(--primary)" />
          <path
            d="M218 119v106l77 37V155Zm77 36v107l79-37V119"
            fill="var(--primary)"
            opacity=".45"
          />
          <rect
            x="154"
            y="43"
            width="74"
            height="64"
            rx="20"
            fill="var(--surface)"
            transform="rotate(-10 191 75)"
          />
          <path
            d="M191 57v32m-16-16h32"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle
            cx="105"
            cy="113"
            r="19"
            fill="var(--primary)"
            opacity=".16"
          />
          <circle cx="105" cy="109" r="6" fill="var(--primary)" />
          <path
            d="M94 123q11-13 22 0"
            stroke="var(--primary)"
            strokeWidth="4"
          />
          <path
            d="m388 56 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z"
            fill="var(--primary)"
            opacity=".6"
          />
          <path
            d="M359 279h28m-14-14v28"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {view === "forgot-password" && (
        <>
          <path
            d="M65 245C28 146 145 59 245 95s91 121 171 44"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="5 8"
            opacity=".5"
          />
          <circle cx="242" cy="184" r="120" fill={`url(#glow-${view})`} />
          <rect
            x="133"
            y="123"
            width="216"
            height="153"
            rx="23"
            fill="var(--surface)"
          />
          <path
            d="m138 137 103 76 103-76"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="m139 264 73-68m131 68-73-68"
            stroke="var(--primary)"
            strokeWidth="2"
            opacity=".3"
          />
          <g transform="rotate(-18 240 110)">
            <rect
              x="194"
              y="52"
              width="95"
              height="109"
              rx="20"
              fill="var(--primary)"
            />
            <circle
              cx="241"
              cy="89"
              r="15"
              stroke="var(--surface)"
              strokeWidth="5"
            />
            <path
              d="M241 104v31m0-8h14"
              stroke="var(--surface)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <path
            d="m383 80 37 15-27 27-3-22-22-3Z"
            fill="var(--primary)"
            opacity=".7"
          />
          <circle cx="83" cy="245" r="15" fill="var(--primary)" opacity=".2" />
          <circle cx="83" cy="245" r="5" fill="var(--primary)" />
          <path
            d="M319 301h27m-13-13v26"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {view === "reset-password" && (
        <>
          <circle
            cx="241"
            cy="173"
            r="133"
            stroke="var(--primary)"
            opacity=".17"
            strokeDasharray="4 9"
          />
          <path
            d="m241 41 107 40v89c0 68-58 115-107 140-49-25-107-72-107-140V81Z"
            fill={`url(#glow-${view})`}
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <path
            d="M209 153v-26a32 32 0 0 1 64 0v26"
            stroke="var(--primary)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <rect
            x="188"
            y="147"
            width="106"
            height="90"
            rx="22"
            fill="var(--primary)"
          />
          <circle cx="241" cy="184" r="9" fill="var(--surface)" />
          <path
            d="M241 190v16"
            stroke="var(--surface)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="332" cy="235" r="34" fill="var(--surface)" />
          <path
            d="m316 235 11 11 22-25"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="64"
            y="172"
            width="95"
            height="39"
            rx="14"
            fill="var(--surface)"
            transform="rotate(-10 111 191)"
          />
          <path
            d="M88 189h.1m18 0h.1m18 0h.1"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="m369 92 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z"
            fill="var(--primary)"
            opacity=".6"
          />
        </>
      )}
    </svg>
  );
}
