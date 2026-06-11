import React, { useEffect, useState } from "react";
import { useGetSettings, getGetSettingsQueryKey, useSaveSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Key, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const saveSettings = useSaveSettings();

  const [gemini, setGemini] = useState("");
  const [eleven, setEleven] = useState("");
  const [tavily, setTavily] = useState("");

  const handleSave = () => {
    saveSettings.mutate({
      data: {
        geminiApiKey: gemini || undefined,
        elevenLabsApiKey: eleven || undefined,
        tavilyApiKey: tavily || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings saved", description: "API keys updated successfully." });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setGemini("");
        setEleven("");
        setTavily("");
      }
    });
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold glow-text flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            System Config
          </h1>
          <p className="text-muted-foreground mt-2">Configure core API integrations</p>
        </div>

        <Card className="glass border-primary/30 glow-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> API Keys</CardTitle>
            <CardDescription>Enter your keys to enable advanced features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Gemini API Key</Label>
              <Input
                type="password"
                value={gemini}
                onChange={e => setGemini(e.target.value)}
                placeholder={settings?.hasGeminiKey ? "•••••••••••••••• (Configured)" : "AI chat requires Gemini API Key"}
                className="bg-black/40 border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">ElevenLabs API Key</Label>
              <Input
                type="password"
                value={eleven}
                onChange={e => setEleven(e.target.value)}
                placeholder={settings?.hasElevenLabsKey ? "•••••••••••••••• (Configured)" : "Voice requires ElevenLabs API Key"}
                className="bg-black/40 border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tavily API Key</Label>
              <Input
                type="password"
                value={tavily}
                onChange={e => setTavily(e.target.value)}
                placeholder={settings?.hasTavilyKey ? "•••••••••••••••• (Configured)" : "Search requires Tavily API Key"}
                className="bg-black/40 border-primary/20"
              />
            </div>

            <Button onClick={handleSave} disabled={saveSettings.isPending} className="w-full bg-primary hover:bg-primary/80 text-black">
              <Save className="w-4 h-4 mr-2" /> Save Configuration
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-destructive/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-destructive">Account Session</h3>
              <p className="text-sm text-muted-foreground">Disconnect from the terminal</p>
            </div>
            <Button variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
