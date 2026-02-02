import { useState } from 'react';
import { AlertTriangle, X, ExternalLink, Monitor, RefreshCw, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnectionContext } from '@/contexts/ConnectionContext';
import { getBaseUrl } from '@/services/config';

interface MixedContentWarningProps {
  onRetry?: () => void;
}

export function MixedContentWarning({ onRetry }: MixedContentWarningProps) {
  const [dismissed, setDismissed] = useState(false);
  const { isOnline, isApiAvailable, reconnect, isChecking } = useConnectionContext();
  const baseUrl = getBaseUrl();
  
  // Só mostrar se online mas API indisponível (indica bloqueio de Mixed Content)
  if (dismissed || !isOnline || isApiAvailable) {
    return null;
  }
  
  const handleOpenHealth = () => {
    window.open(`${baseUrl}/api/health`, '_blank');
  };

  const handleRetry = () => {
    reconnect();
    onRetry?.();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-warning/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-warning/10 border-b border-warning/20 p-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Conexão Bloqueada pelo Navegador
            </h2>
            <p className="text-muted-foreground text-sm">
              O navegador está bloqueando a conexão com o servidor local por questões de segurança (HTTPS → HTTP).
            </p>
          </div>
          <button 
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Servidor info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Monitor className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Servidor Local</p>
              <p className="text-sm text-muted-foreground font-mono">{baseUrl}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          </div>

          {/* Instruções */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Como liberar a conexão:
            </h3>
            
            <div className="space-y-3">
              {/* Passo 1 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Clique no botão abaixo para testar o servidor</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se aparecer uma página de aviso, clique em "Avançado" e depois "Prosseguir"
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleOpenHealth}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Testar {baseUrl}/api/health
                  </Button>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Libere o conteúdo inseguro no navegador</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no ícone de <strong>cadeado 🔒</strong> ao lado da URL → "Configurações do site" → "Conteúdo inseguro" → <strong>"Permitir"</strong>
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Recarregue a página</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após permitir, pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">F5</kbd> ou clique em "Reconectar" abaixo
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dica Chrome/Edge */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">💡 Dica para Chrome/Edge:</strong> Digite <code className="bg-muted px-1 rounded">chrome://flags/#allow-insecure-localhost</code> na barra de endereços e ative a opção para permitir conexões inseguras em localhost permanentemente.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/30 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Ignorar por agora
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenHealth}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Servidor
            </Button>
            <Button onClick={handleRetry} disabled={isChecking}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Reconectar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Versão compacta para exibir na tela
export function MixedContentBanner() {
  const { isOnline, isApiAvailable, reconnect, isChecking } = useConnectionContext();
  const baseUrl = getBaseUrl();
  
  if (!isOnline || isApiAvailable) return null;
  
  const handleOpenHealth = () => {
    window.open(`${baseUrl}/api/health`, '_blank');
  };
  
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Navegador bloqueando conexão com servidor local
            </p>
            <p className="text-xs text-muted-foreground">
              Clique no cadeado 🔒 → Configurações do site → Conteúdo inseguro → Permitir
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenHealth}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Testar Servidor
          </Button>
          <Button size="sm" onClick={reconnect} disabled={isChecking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Reconectar
          </Button>
        </div>
      </div>
    </div>
  );
}
