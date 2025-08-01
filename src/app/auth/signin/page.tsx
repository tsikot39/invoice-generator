import { Metadata } from "next";
import { SignInForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign In | Invoice Generator",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          Invoice Generator
        </div>
        <div className="relative z-20 flex-1 flex items-center justify-center">
          <div className="space-y-6 text-center">
            {/* Professional Invoice SaaS Illustration */}
            <div className="flex justify-center">
              <svg
                width="280"
                height="220"
                viewBox="0 0 200 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white/90"
              >
                {/* Background Circle for Depth */}
                <circle
                  cx="100"
                  cy="80"
                  r="75"
                  fill="url(#backgroundGradient)"
                  opacity="0.1"
                />

                {/* Main Invoice Document */}
                <rect
                  x="60"
                  y="30"
                  width="80"
                  height="100"
                  rx="6"
                  fill="url(#invoiceGradient)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                {/* Invoice Header Lines */}
                <rect
                  x="68"
                  y="40"
                  width="30"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.8"
                />
                <rect
                  x="68"
                  y="45"
                  width="20"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.6"
                />

                {/* Invoice Number Badge */}
                <rect
                  x="105"
                  y="38"
                  width="28"
                  height="8"
                  rx="4"
                  fill="url(#badgeGradient)"
                />
                <rect
                  x="107"
                  y="40.5"
                  width="24"
                  height="3"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />

                {/* Invoice Items */}
                <rect
                  x="68"
                  y="58"
                  width="45"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.7"
                />
                <rect
                  x="118"
                  y="58"
                  width="15"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.9"
                />

                <rect
                  x="68"
                  y="65"
                  width="35"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.7"
                />
                <rect
                  x="118"
                  y="65"
                  width="15"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.9"
                />

                <rect
                  x="68"
                  y="72"
                  width="40"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.7"
                />
                <rect
                  x="118"
                  y="72"
                  width="15"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  opacity="0.9"
                />

                {/* Total Section */}
                <rect
                  x="68"
                  y="85"
                  width="65"
                  height="1"
                  rx="0.5"
                  fill="currentColor"
                  opacity="0.4"
                />
                <rect
                  x="68"
                  y="92"
                  width="30"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.8"
                />
                <rect
                  x="105"
                  y="91"
                  width="28"
                  height="4"
                  rx="2"
                  fill="url(#totalGradient)"
                />

                {/* Currency Symbol */}
                <circle
                  cx="35"
                  cy="65"
                  r="15"
                  fill="url(#currencyGradient)"
                  opacity="0.9"
                />
                <text
                  x="35"
                  y="70"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill="white"
                >
                  $
                </text>

                {/* Charts/Analytics */}
                <rect
                  x="150"
                  y="50"
                  width="35"
                  height="25"
                  rx="3"
                  fill="url(#chartGradient)"
                  opacity="0.8"
                />

                {/* Chart Bars */}
                <rect
                  x="155"
                  y="65"
                  width="3"
                  height="8"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="161"
                  y="60"
                  width="3"
                  height="13"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="167"
                  y="55"
                  width="3"
                  height="18"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="173"
                  y="62"
                  width="3"
                  height="11"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />

                {/* Growth Arrow */}
                <path
                  d="M165 45 L175 35 L172 35 L172 30 L178 30 L178 38 L175 38 L185 45"
                  stroke="url(#arrowGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Floating Elements for Modern Feel */}
                <circle
                  cx="45"
                  cy="35"
                  r="3"
                  fill="currentColor"
                  opacity="0.3"
                />
                <circle
                  cx="155"
                  cy="25"
                  r="2"
                  fill="currentColor"
                  opacity="0.4"
                />
                <circle
                  cx="25"
                  cy="110"
                  r="2.5"
                  fill="currentColor"
                  opacity="0.3"
                />
                <circle
                  cx="175"
                  cy="120"
                  r="2"
                  fill="currentColor"
                  opacity="0.4"
                />

                {/* Professional Badge/Seal */}
                <circle
                  cx="165"
                  cy="105"
                  r="12"
                  fill="url(#sealGradient)"
                  opacity="0.9"
                />
                <path
                  d="M160 105 L163 108 L170 100"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <defs>
                  <linearGradient
                    id="backgroundGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                  </linearGradient>

                  <linearGradient
                    id="invoiceGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
                  </linearGradient>

                  <linearGradient
                    id="badgeGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>

                  <linearGradient
                    id="totalGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>

                  <linearGradient
                    id="currencyGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>

                  <linearGradient
                    id="chartGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>

                  <linearGradient
                    id="arrowGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>

                  <linearGradient
                    id="sealGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight whitespace-nowrap">
                Professional Invoicing Made Simple
              </h2>
              <p className="text-lg text-zinc-300">
                Create, manage, and track your invoices with ease. Perfect for
                freelancers and small businesses.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to sign in to your account
            </p>
          </div>
          <SignInForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
