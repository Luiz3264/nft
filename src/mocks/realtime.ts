import type { Order, Nft } from "@/api/contracts";

type RealtimeEvent =
  "nft.updated" | "order.updated" | "session.expired" | "mock.connected";
type Emit = (event: string, payload: unknown) => void;

const clients = new Set<Emit>();

export const realtimeHub = {
  get subscriberCount() {
    return clients.size;
  },
  attach(emit: Emit) {
    clients.add(emit);
    return () => {
      clients.delete(emit);
    };
  },
  broadcast(event: RealtimeEvent, payload: unknown) {
    for (const emit of clients) emit(event, payload);
  },
  nftUpdated(nft: Nft & { sequence: number }) {
    this.broadcast("nft.updated", nft);
  },
  orderUpdated(order: Order) {
    this.broadcast("order.updated", order);
  },
};
