import { Injectable } from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import { Observable } from "rxjs";

export interface PresenceState {
  userId: string;
  email: string;
  nodeId?: string;
  action?: string;
  lastSeenAt: number;
}
type Listener = (event: MessageEvent) => void;
type EventData = string | object;

@Injectable()
export class RealtimeService {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly presence = new Map<string, Map<string, PresenceState>>();

  subscribe(canvasId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const listener: Listener = (event) => subscriber.next(event);
      const set = this.listeners.get(canvasId) ?? new Set<Listener>();
      set.add(listener);
      this.listeners.set(canvasId, set);
      subscriber.next({ type: "ready", data: { connected: true } });
      return () => {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(canvasId);
      };
    });
  }

  publish(canvasId: string, type: string, data: EventData): void {
    const event: MessageEvent = { type, data };
    for (const listener of this.listeners.get(canvasId) ?? []) listener(event);
  }

  heartbeat(
    canvasId: string,
    state: Omit<PresenceState, "lastSeenAt">,
  ): PresenceState[] {
    const now = Date.now();
    const canvasPresence =
      this.presence.get(canvasId) ?? new Map<string, PresenceState>();
    canvasPresence.set(state.userId, { ...state, lastSeenAt: now });
    for (const [userId, item] of canvasPresence)
      if (now - item.lastSeenAt > 45_000) canvasPresence.delete(userId);
    this.presence.set(canvasId, canvasPresence);
    const active = [...canvasPresence.values()];
    this.publish(canvasId, "presence", active);
    return active;
  }

  currentPresence(canvasId: string): PresenceState[] {
    const now = Date.now();
    const canvasPresence = this.presence.get(canvasId);
    if (!canvasPresence) return [];
    for (const [userId, item] of canvasPresence)
      if (now - item.lastSeenAt > 45_000) canvasPresence.delete(userId);
    return [...canvasPresence.values()];
  }
}
