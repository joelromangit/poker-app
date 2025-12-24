'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada como PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Verificar si el usuario ya descartó el prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Escuchar el evento beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Desktop - usar el prompt nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // iOS - mostrar instrucciones manuales
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // No mostrar si ya está instalada, ya se descartó, o no hay opción de instalar
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Botón de instalar en el header */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
        title="Instalar aplicación"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Instalar</span>
      </button>

      {/* Modal de instrucciones para iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-background-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Instalar Poker Nights</h2>
                  <p className="text-sm text-foreground-muted">en tu iPhone/iPad</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-2 text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-3 bg-background rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Toca el botón Compartir</p>
                  <p className="text-sm text-foreground-muted flex items-center gap-1">
                    <Share className="w-4 h-4" /> en la barra de Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-background rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Selecciona "Añadir a pantalla de inicio"</p>
                  <p className="text-sm text-foreground-muted flex items-center gap-1">
                    <Plus className="w-4 h-4" /> en el menú
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-background rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Toca "Añadir"</p>
                  <p className="text-sm text-foreground-muted">¡Y listo! Ya tienes la app</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Componente separado para el banner de instalación (opcional, para mostrar en home)
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (standalone) return;

    // Verificar si ya se mostró recientemente
    const lastShown = localStorage.getItem('pwa-banner-shown');
    if (lastShown) {
      const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // No mostrar si se mostró hace menos de 7 días
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    if (iOS) {
      // En iOS, mostrar después de un delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
    localStorage.setItem('pwa-banner-shown', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-shown', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-background-card rounded-2xl p-4 border border-border shadow-lg z-40 animate-slide-in">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-foreground-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Instalar Poker Nights</p>
            <p className="text-xs text-foreground-muted">Acceso rápido desde tu pantalla</p>
          </div>
        </div>
        
        <button
          onClick={handleInstall}
          className="w-full py-2.5 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Instalar ahora
        </button>
      </div>

      {/* Modal iOS igual que arriba pero simplificado */}
      {showIOSModal && isIOS && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center p-4 z-50">
          <div className="bg-background-card rounded-t-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Instalar en iOS</h3>
            <p className="text-foreground-muted mb-4">
              Toca <Share className="w-4 h-4 inline" /> en Safari → "Añadir a pantalla de inicio"
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-primary text-white rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

