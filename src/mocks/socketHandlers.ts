import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { mockStore } from "./state";
import { realtimeHub } from "./realtime";

const socketLink = ws.link(/\/socket\.io\//);

export const socketHandlers = [
  socketLink.addEventListener("connection", (connection) => {
    const socket = toSocketIo(connection);
    queueMicrotask(() => connection.server.connect());
    let detach: () => void = () => {};
    socket.client.on("subscribe", (_event, sessionToken: string | null) => {
      const user = mockStore.session(sessionToken)?.user;
      if (mockStore.scenario === "session-expired") {
        socket.server.emit("session.expired", { code: "SESSION_EXPIRED" });
        return;
      }
      detach();
      detach = realtimeHub.attach((event, payload) =>
        socket.server.emit(event, payload),
      );
      socket.server.emit("mock.connected", {
        userId: user?.id ?? null,
        scenario: mockStore.scenario,
      });
    });
    socket.client.on(
      "scenario.trigger",
      (payload: {
        type?: string;
        nftId?: number;
        price?: number;
        availableCopies?: number;
      }) => {
        if (payload?.type === "nft.updated" && payload.nftId) {
          const updated = mockStore.updateNft(payload.nftId, {
            ...(payload.price === undefined ? {} : { price: payload.price }),
            ...(payload.availableCopies === undefined
              ? {}
              : { availableCopies: payload.availableCopies }),
          });
          if (updated) realtimeHub.nftUpdated(updated);
        }
      },
    );
    connection.client.addEventListener("close", () => detach());
  }),
];
