import Sidebar from "@/components/SettingsSidebar";
import { websocketURI } from "@/utils/chat/agent";
import { safeJsonParse } from "@/utils/request";
import { isMobile } from "react-device-detect";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function TaskMonitor() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const socket = new WebSocket(`${websocketURI()}/task-monitor`);
    socket.addEventListener("message", (event) => {
      const data = safeJsonParse(event.data, null);
      if (!data) return;
      if (data.type === "queue") {
        setTasks(data.tasks || []);
      } else if (data.type === "taskUpdate") {
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === data.taskId ? { ...t, status: data.status } : t
          );
          if (!updated.some((t) => t.id === data.taskId)) {
            updated.push({ id: data.taskId, status: data.status });
          }
          return updated;
        });
      }
    });
    return () => socket.close();
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="flex gap-x-4 items-center">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                {t("tasks.title")}
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
              {t("tasks.description")}
            </p>
          </div>
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-xs text-left rounded-lg min-w-[640px] border-spacing-0">
              <thead className="text-theme-text-secondary text-xs leading-[18px] font-bold uppercase border-white/10 border-b">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3">Cluster</th>
                  <th className="px-6 py-3 rounded-tr-lg">Run At</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/10">
                    <td className="px-6 py-3 font-mono">{task.id}</td>
                    <td className="px-6 py-3 capitalize">{task.status}</td>
                    <td className="px-6 py-3">{task.priority}</td>
                    <td className="px-6 py-3">{task.group || "-"}</td>
                    <td className="px-6 py-3">{task.cluster || "-"}</td>
                    <td className="px-6 py-3">
                      {new Date(task.runAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-3 text-center text-theme-text-secondary"
                    >
                      {t("tasks.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
