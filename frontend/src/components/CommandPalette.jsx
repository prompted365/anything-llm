import { useEffect, useState } from "react";
import { safeJsonParse } from "@/utils/request";

/**
 * Basic command palette component that fetches available commands from a
 * websocket connection and allows users to execute them.
 *
 * @param {{ socket: WebSocket|null }} props
 */
export default function CommandPalette({ socket = null }) {
  const [commands, setCommands] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = safeJsonParse(event.data, null);
      if (data?.type === "commandList" && Array.isArray(data.content)) {
        setCommands(data.content);
      }
    };

    socket.addEventListener("message", handleMessage);
    socket.send(JSON.stringify({ type: "listCommands" }));

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  const runCommand = (command) => {
    if (!socket) return;
    socket.send(
      JSON.stringify({ type: "executeCommand", command: command.name })
    );
  };

  if (commands.length === 0) return null;

  return (
    <div className="command-palette flex flex-col gap-2">
      {commands.map((cmd) => (
        <button
          key={cmd.name}
          onClick={() => runCommand(cmd)}
          className="text-left px-2 py-1 rounded bg-theme-action-menu-item-hover"
        >
          <span className="font-semibold">{cmd.name}</span>
          {cmd.description && (
            <span className="block text-xs text-theme-text-secondary">
              {cmd.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
