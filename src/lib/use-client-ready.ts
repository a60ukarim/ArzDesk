"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
const client = () => true;
const server = () => false;
/** Prevent native form submission before React has attached event handlers. */
export function useClientReady() {
  return useSyncExternalStore(subscribe, client, server);
}
