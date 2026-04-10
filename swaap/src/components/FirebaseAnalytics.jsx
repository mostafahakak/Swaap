"use client";

import { useEffect } from "react";
import { firebaseConfig } from "@/lib/firebase-config";

export function FirebaseAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.all([
      import("firebase/app"),
      import("firebase/analytics"),
    ])
      .then(([{ initializeApp }, { getAnalytics }]) => {
        const app = initializeApp(firebaseConfig);
        getAnalytics(app);
      })
      .catch(() => {});
  }, []);
  return null;
}
