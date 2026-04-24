"use client";

import * as React from "react";

interface RightPanelContextValue {
  slot: React.ReactNode | null;
  setSlot: (node: React.ReactNode | null) => void;
}

const RightPanelContext = React.createContext<RightPanelContextValue | null>(
  null,
);

export function RightPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [slot, setSlot] = React.useState<React.ReactNode | null>(null);
  return (
    <RightPanelContext.Provider value={{ slot, setSlot }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanelSlot(): RightPanelContextValue {
  const ctx = React.useContext(RightPanelContext);
  if (!ctx) {
    throw new Error(
      "useRightPanelSlot doit être utilisé dans un RightPanelProvider",
    );
  }
  return ctx;
}
