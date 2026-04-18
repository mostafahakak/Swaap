"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/firebase-app";
import { useAuth } from "@/context/AuthContext";
import { apiAuthVerify } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { userExists, loading: authLoading, firebaseUser, refreshSession, apiConfigured } = useAuth();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmationRef = useRef(null);
  const verifierRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (firebaseUser && userExists) router.replace("/");
  }, [authLoading, firebaseUser, userExists, router]);

  // RecaptchaVerifier is one-shot: recreate whenever we're on the phone step (including after "Change number").
  // Do not clip the container to zero pixels — that can break invisible reCAPTCHA and yield auth/invalid-app-credential.
  useEffect(() => {
    if (step !== "phone") return undefined;

    let cancelled = false;

    const mountVerifier = () => {
      try {
        verifierRef.current?.clear?.();
        verifierRef.current = null;
        if (cancelled) return;
        verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      } catch (e) {
        console.error(e);
      }
    };

    mountVerifier();

    return () => {
      cancelled = true;
      try {
        verifierRef.current?.clear?.();
      } catch {
        /* ignore */
      }
      verifierRef.current = null;
    };
  }, [step]);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const v = verifierRef.current;
      if (!v) throw new Error("reCAPTCHA not ready. Refresh the page.");
      confirmationRef.current = await signInWithPhoneNumber(auth, phone.trim(), v);
      setStep("otp");
    } catch (err) {
      const code = err?.code;
      if (code === "auth/invalid-app-credential") {
        setError(
          "Phone verification failed (invalid app credential). In Google Cloud → Credentials, ensure your Browser API key allows this site’s URL, or temporarily remove HTTP referrer restrictions. Also confirm Phone sign-in and authorized domains in Firebase."
        );
      } else {
        setError(err.message || "Could not send code");
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const cred = await confirmationRef.current.confirm(otp.trim());
      const token = await cred.user.getIdToken();
      const v = await apiAuthVerify(token);
      await refreshSession(cred.user);
      if (v._demoNoBackend) {
        router.replace("/");
        return;
      }
      if (!v.userExists) router.replace("/onboarding/enter-info");
      else router.replace("/");
    } catch (err) {
      const msg = err.message || "Invalid code";
      if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
        setError(
          "Could not reach the API (network/CORS). On Render, set CORS_ORIGIN to include https://swaap.it.com and redeploy the backend. Ensure NEXT_PUBLIC_API_URL points to your API (e.g. https://swaap.onrender.com) with no trailing slash."
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-orb absolute -left-20 top-10 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--swaap-primary)_28%,transparent)] blur-3xl" />
        <div className="animate-orb-delayed absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--swaap-sky)_35%,transparent)] blur-3xl" />
      </div>

      <Logo variant="compact" className="mb-8 inline-flex" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--swaap-primary)]">
        Create · Connect · Collaborate
      </p>
      <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-[var(--swaap-ink)]">
        Sign in with phone
      </h1>
      <p className="mt-2 text-neutral-600">
        {step === "phone"
          ? "Enter your mobile number in international format. We’ll text you a one-time code."
          : "Enter the verification code we sent to your phone."}
      </p>

      {!apiConfigured ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-medium">Tip:</strong> Set{" "}
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_API_URL</code> in{" "}
          <code className="rounded bg-amber-100/80 px-1">.env.local</code> (e.g.{" "}
          <code className="rounded bg-amber-100/80 px-1">http://localhost:4000</code>) so profiles and
          events sync with the API. Without it, you can still test Firebase phone sign-in only.
        </p>
      ) : null}

      {/* Invisible reCAPTCHA still mounts here; avoid sr-only/clip(0) — Google can reject the widget. */}
      <div id="recaptcha-container" className="mt-3 min-h-[1px] w-full" aria-hidden />

      {step === "phone" ? (
        <form onSubmit={sendOtp} className="mt-8 space-y-5 animate-fade-up">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-black shadow-sm transition-shadow focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_22%,transparent)]"
              placeholder="+44 7911 123456"
              required
            />
            <p className="mt-2 text-xs text-neutral-500">Use E.164 format, e.g. +447911123456</p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[var(--swaap-primary)] py-3 text-base font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-8 space-y-5 animate-fade-up">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-neutral-700">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-mono text-lg tracking-[0.35em] text-black shadow-sm focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_22%,transparent)]"
              placeholder="••••••"
              maxLength={6}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[var(--swaap-primary)] py-3 text-base font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="w-full text-sm text-neutral-500 transition hover:text-black"
          >
            ← Change phone number
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-neutral-500">
        New to SWAAP? Phone sign-in creates your account—then we’ll save your profile if the API is configured.{" "}
        <Link href="/about" className="font-medium text-[var(--swaap-primary)] hover:underline">
          About the platform
        </Link>
      </p>
    </div>
  );
}
