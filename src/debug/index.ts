import ReconnectingWebSocket from "reconnecting-websocket";
import WebSocket from "ws"; // Import the WebSocket implementation for Node.js

export interface ISelect<T = string> {
  label: string;
  value: T;
}

let selectedAccount: ISelect | null = null;

const onOpen = (account: ISelect | null) => {
  if (!account) {
    return;
  }
  console.log(`Debug stream opened for account ${account.value}`);
};

const onError = () => {
  console.error("Something went wrong! Check your connection and try again.");
};

const onClose = (e: any) => {
  // 999 = closed websocket connection by switching account
  if (e.code !== 4999) {
    console.error(`Connection was closed. [code: ${e.code}]`);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onMessage = (event: any) => {
  // Ping returns just account address, if we get that
  // response we don't need to log anything
  if (event.data !== selectedAccount?.value) {
    console.log(event.data);
  }
};

let socket: ReconnectingWebSocket | null = null;

export const addListeners = (account: ISelect | null) => {
  if (account?.value && socket?.url.endsWith(account.value)) {
    return;
  }
  selectedAccount = account;

  if (account?.value) {
    if (socket) {
      socket.removeEventListener("open", () => onOpen(account));
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
    }

    socket = new ReconnectingWebSocket(
      `${process.env.HOOKS_DEBUG_HOST}/${account.value}`,
      [],
      {
        WebSocket: WebSocket,
      }
    );

    socket.addEventListener("open", () => onOpen(account));
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);
  }
};
