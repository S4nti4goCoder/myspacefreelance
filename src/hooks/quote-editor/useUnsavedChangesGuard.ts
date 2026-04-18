import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface UnsavedChangesGuard {
  isDirty: boolean;
  markDirty: () => void;
  clearDirty: () => void;
  showDialog: boolean;
  safeNavigate: (to: string) => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function useUnsavedChangesGuard(): UnsavedChangesGuard {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const clearDirty = useCallback(() => setIsDirty(false), []);

  const safeNavigate = useCallback(
    (to: string) => {
      if (isDirty) {
        pendingNavRef.current = to;
        setShowDialog(true);
      } else {
        navigate(to);
      }
    },
    [isDirty, navigate],
  );

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, [navigate]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return {
    isDirty,
    markDirty,
    clearDirty,
    showDialog,
    safeNavigate,
    confirmLeave,
    cancelLeave,
  };
}
