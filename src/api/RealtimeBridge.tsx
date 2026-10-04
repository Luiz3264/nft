import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectRealtime, disconnectRealtime } from "./realtime";
import { queryKeys } from "./hooks";
import type { Nft } from "./contracts";

export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    const timer = window.setTimeout(() => {
      void connectRealtime().then((socket) => {
        if (disposed) {
          disconnectRealtime();
          return;
        }
        const subscribe = () => {
          socket.emit(
            "subscribe",
            window.localStorage.getItem("kurio.mock.token"),
          );
          void queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
          void queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
          void queryClient.invalidateQueries({ queryKey: ["orders"] });
        };
        const onNftUpdated = (nft: Nft) => {
          queryClient.setQueryData(
            queryKeys.catalog,
            (
              current:
                | {
                    items: Nft[];
                    total: number;
                    page: number;
                    pageSize: number;
                    hasMore: boolean;
                  }
                | undefined,
            ) =>
              current && {
                ...current,
                items: current.items.map((item) =>
                  item.id === nft.id && nft.version > item.version ? nft : item,
                ),
              },
          );
          queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
        };
        const onOrderUpdated = () => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["cart-summary"] });
        };
        socket.on("connect", subscribe);
        socket.on("nft.updated", onNftUpdated);
        socket.on("order.updated", onOrderUpdated);
        socket.connect();
      });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      disconnectRealtime();
    };
  }, [queryClient]);

  return null;
}
