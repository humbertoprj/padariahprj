import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Instalar() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Instalar Padaria H</CardTitle>
          <CardDescription>
            Instale o app no seu celular para acesso rápido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">
                App instalado com sucesso!
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <p className="font-medium text-blue-900">Para instalar no iPhone/iPad:</p>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta)</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                </ol>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                <p className="font-medium text-amber-900">Para instalar no Android:</p>
                <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                  <li>Toque no menu do navegador (três pontos)</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                  <li>Confirme a instalação</li>
                </ol>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
