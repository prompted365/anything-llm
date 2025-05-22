import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import { useEffect, useState } from "react";
import System from "@/models/system";
import CTAButton from "@/components/lib/CTAButton";
import showToast from "@/utils/toast";
import { useTranslation } from "react-i18next";

export default function MCPSettings() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [mcpHost, setMcpHost] = useState("");
  const [mcpClient, setMcpClient] = useState("");
  const [mcpServers, setMcpServers] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const keys = await System.keys();
      setMcpHost(keys?.MCP_HOST || "");
      setMcpClient(keys?.MCP_CLIENT || "");
      setMcpServers(keys?.MCP_SERVERS || "");
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await System.updateSystem({
      MCPHost: mcpHost,
      MCPClient: mcpClient,
      MCPServers: mcpServers,
    });
    if (error) {
      showToast(`Failed to save MCP settings: ${error}`, "error");
      setSaving(false);
      return;
    }
    showToast("MCP settings saved successfully.", "success");
    setSaving(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] w-full h-full flex justify-center items-center"
      >
        <p className="text-theme-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <form onSubmit={handleSubmit} className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16 gap-y-6">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white light:border-theme-sidebar-border border-b-2 border-opacity-10">
            <div className="flex gap-x-4 items-center">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                {t("mcp.title")}
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              {t("mcp.description")}
            </p>
          </div>

          <div className="flex flex-col gap-y-4 max-w-[600px]">
            <label className="text-theme-text-primary text-sm font-medium" htmlFor="mcp_host">
              {t("mcp.host")}
            </label>
            <input
              id="mcp_host"
              type="text"
              value={mcpHost}
              onChange={(e) => {
                setMcpHost(e.target.value);
                setHasChanges(true);
              }}
              className="bg-theme-settings-input-bg border border-theme-settings-input-border rounded-md px-3 py-2 text-sm"
            />

            <label className="text-theme-text-primary text-sm font-medium" htmlFor="mcp_client">
              {t("mcp.client")}
            </label>
            <input
              id="mcp_client"
              type="text"
              value={mcpClient}
              onChange={(e) => {
                setMcpClient(e.target.value);
                setHasChanges(true);
              }}
              className="bg-theme-settings-input-bg border border-theme-settings-input-border rounded-md px-3 py-2 text-sm"
            />

            <label className="text-theme-text-primary text-sm font-medium" htmlFor="mcp_servers">
              {t("mcp.servers")}
            </label>
            <textarea
              id="mcp_servers"
              rows="6"
              value={mcpServers}
              onChange={(e) => {
                setMcpServers(e.target.value);
                setHasChanges(true);
              }}
              className="bg-theme-settings-input-bg border border-theme-settings-input-border rounded-md px-3 py-2 text-sm font-mono"
            />
          </div>

          {hasChanges && (
            <div className="w-full flex justify-end">
              <CTAButton className="mt-2" type="submit">
                {saving ? t("common.saving") : t("common.save")}
              </CTAButton>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
