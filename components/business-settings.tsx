'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Store,
  MapPin,
  ImageUp,
  QrCode,
  Download,
  Copy,
  Check,
  CreditCard,
  Link,
  Bot,
  MessageCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { BusinessConfig } from '@/lib/data/business-config';
import { loadConfig, saveConfig, qrContent } from '@/lib/data/business-config';
import { createClient } from '@/lib/supabase/client';
import { loadConfigFromDB, saveConfigToDB } from '@/lib/data/business-config-db';
import {
  getSubscriptionFromMetadata,
  isSubscriptionActive,
  getTrialDaysLeft,
} from '@/lib/subscription';
import type { SubscriptionData } from '@/lib/subscription';

export function BusinessSettings() {
  const supabase = createClient();
  const [config, setConfig] = useState<BusinessConfig>(loadConfig);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const local = loadConfig();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        loadConfigFromDB(user.id, supabase).then((db) => {
          setConfig({ ...local, ...db, logo: db.logo || local.logo });
        });
      } else {
        setConfig(local);
      }
    });
  }, []);

  const update = <K extends keyof BusinessConfig>(
    field: K,
    value: BusinessConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveConfig(config);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        saveConfigToDB(user.id, config, supabase);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('logo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDownloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const img = new Image();
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const padding = 40;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

      let y = size - 12;

      if (config.logo) {
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoMaxH = 48;
          const logoW = logoImg.width * (logoMaxH / logoImg.height);
          const logoX = (size - logoW) / 2;
          const logoY = y - logoMaxH - 8;
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoMaxH);

          if (config.nombre) {
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(config.nombre, size / 2, logoY - 8);
          }

          canvas.toBlob((blob) => {
            if (!blob) return;
            const link = document.createElement('a');
            link.download = `qr-${config.nombre || 'hostel'}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }, 'image/png');
        };
        logoImg.src = config.logo;
      } else if (config.nombre) {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.nombre, size / 2, y);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement('a');
          link.download = `qr-${config.nombre || 'hostel'}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }, 'image/png');
      } else {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement('a');
          link.download = `qr-${config.nombre || 'hostel'}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [config.nombre, config.logo]);

  const qrValue = qrContent(config);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Configuración del Negocio</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Datos de facturación y cobro para tus huéspedes
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="gap-2 bg-sky-600 text-white hover:bg-sky-700"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Guardado
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-6">
          {/* Datos del Negocio */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Store className="h-4 w-4 text-sky-400" />
                Datos del Negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-zinc-300">
                  Nombre del hotel/hostel
                </Label>
                <Input
                  id="nombre"
                  value={config.nombre}
                  onChange={(e) => update('nombre', e.target.value)}
                  placeholder="Ej: Hostel Buenos Aires"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-zinc-300">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={config.direccion}
                  onChange={(e) => update('direccion', e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titular" className="text-zinc-300">
                    Titular de la cuenta
                  </Label>
                  <Input
                    id="titular"
                    value={config.titular}
                    onChange={(e) => update('titular', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banco" className="text-zinc-300">
                    Banco
                  </Label>
                  <Input
                    id="banco"
                    value={config.banco}
                    onChange={(e) => update('banco', e.target.value)}
                    placeholder="Ej: Banco Macro"
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo" className="text-zinc-300">
                  Logo
                </Label>
                <div className="flex items-center gap-4">
                  {config.logo && (
                    <img
                      src={config.logo}
                      alt="logo"
                      className="h-12 w-12 rounded-lg border border-zinc-700 object-contain bg-zinc-800"
                    />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white">
                    <ImageUp className="h-4 w-4" />
                    {config.logo ? 'Cambiar logo' : 'Subir logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de Cobro */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Datos de Cobro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias" className="text-zinc-300">
                  Alias / CBU / CVU
                </Label>
                <Textarea
                  id="alias"
                  value={config.aliasCbuCvu}
                  onChange={(e) => update('aliasCbuCvu', e.target.value)}
                  placeholder="Ej: alias.mercadopago o CBU: 123456..."
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkPago" className="text-zinc-300">
                  Link de Pago (Mercado Pago)
                </Label>
                <Input
                  id="linkPago"
                  value={config.linkPago}
                  onChange={(e) => update('linkPago', e.target.value)}
                  placeholder="https://mpago.la/..."
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
                {!config.linkPago && (
                  <p className="text-xs text-zinc-500">
                    Creá tu link en mercadopago.com.ar/herramientas/cobrar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chatbot de WhatsApp */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Bot className="h-4 w-4 text-green-400" />
                Chatbot de WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-zinc-300 font-medium">Activar chatbot</p>
                  <p className="text-xs text-zinc-500">El bot responderá mensajes automáticamente</p>
                </div>
                <Switch
                  checked={config.botEnabled ?? false}
                  onCheckedChange={(val) => update('botEnabled', val)}
                />
              </div>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <Label className="text-zinc-300">WhatsApp API Token</Label>
                <Input
                  type="password"
                  value={config.whatsappApiToken ?? ''}
                  onChange={(e) => update('whatsappApiToken', e.target.value)}
                  placeholder="EAAT..."
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Phone Number ID</Label>
                <Input
                  value={config.whatsappPhoneId ?? ''}
                  onChange={(e) => update('whatsappPhoneId', e.target.value)}
                  placeholder="123456789"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Verify Token</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.whatsappVerifyToken ?? ''}
                    onChange={(e) => update('whatsappVerifyToken', e.target.value)}
                    placeholder="Token de verificación"
                    className="border-zinc-700 bg-zinc-800 text-white font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    onClick={() => update('whatsappVerifyToken', crypto.randomUUID())}
                    title="Generar nuevo token"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Personalidad del bot</Label>
                <Textarea
                  value={config.botPersonality ?? ''}
                  onChange={(e) => update('botPersonality', e.target.value)}
                  placeholder="Ej: Somos un hostel familiar en Bariloche. Tenemos desayuno los fines de semana."
                  className="border-zinc-700 bg-zinc-800 text-white resize-none"
                  rows={3}
                />
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                <p className="text-xs font-medium text-zinc-300">📋 Cómo configurar en Meta:</p>
                <p className="text-[11px] text-zinc-500">1. Entrá a developers.facebook.com</p>
                <p className="text-[11px] text-zinc-500">2. Creá una app tipo Business → agregá WhatsApp</p>
                <p className="text-[11px] text-zinc-500">3. En Webhooks pegá esta URL:</p>
                <p className="text-[11px] text-sky-400 break-all">https://aizlyhabitapp.vercel.app/api/webhook/whatsapp</p>
                <p className="text-[11px] text-zinc-500">4. En Verify Token pegá el token generado arriba</p>
                <p className="text-[11px] text-zinc-500">5. Copiá el Token de acceso y Phone Number ID</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Panel */}
        <div>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <QrCode className="h-4 w-4 text-sky-400" />
                QR de Mostrador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-500">
                El QR contiene tus datos de pago. El huésped lo escanea y paga al instante.
              </p>

              {qrValue ? (
                <>
                  <div
                    ref={qrRef}
                    className="flex justify-center rounded-xl bg-white p-4"
                  >
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="M"
                      includeMargin
                    />
                  </div>

                  <Button
                    onClick={handleDownloadQR}
                    className="w-full gap-2 bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    <Download className="h-4 w-4" />
                    Descargar QR (PNG)
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
                  <QrCode className="h-10 w-10 text-zinc-600" />
                  <p className="text-sm text-zinc-500">
                    Ingresá el link de Mercado Pago arriba
                  </p>
                </div>
              )}

              <Separator className="bg-zinc-800" />

              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">Vista previa del comprobante</p>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  {config.logo && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={config.logo}
                        alt="logo"
                        className="h-16 w-auto max-h-16 object-contain"
                      />
                    </div>
                  )}
                  {config.nombre && (
                    <p className="text-xs font-semibold text-white">{config.nombre}</p>
                  )}
                  {config.titular && (
                    <p className="text-[10px] text-zinc-500">{config.titular}</p>
                  )}
                  {config.banco && (
                    <p className="text-[10px] text-zinc-500">{config.banco}</p>
                  )}
                  {config.linkPago ? (
                    <a
                      href={config.linkPago}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[10px] text-sky-400 break-all hover:underline"
                    >
                      {config.linkPago}
                    </a>
                  ) : config.aliasCbuCvu ? (
                    <p className="mt-1 text-[10px] text-zinc-400 break-all">{config.aliasCbuCvu}</p>
                  ) : null}
                  {qrValue && (
                    <div className="mt-2 flex justify-center">
                      <QRCodeSVG value={qrValue} size={60} level="M" />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-zinc-500 hover:text-zinc-300"
                  onClick={() => {
                    navigator.clipboard.writeText(qrValue);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? 'Copiado' : 'Copiar datos de pago'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan / Suscripción */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <CreditCard className="h-4 w-4 text-sky-400" />
                Plan y Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubscriptionStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SubscriptionStatus() {
  const supabase = createClient();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const metadata = user.user_metadata as { subscription?: string };
      setSub(getSubscriptionFromMetadata(metadata));
      setLoading(false);
    });
  }, []);

  const activatePro = async () => {
    setActivating(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActivating(false); return; }

    const currentSub = getSubscriptionFromMetadata(
      (user.user_metadata as { subscription?: string })
    );
    const updated: SubscriptionData = {
      ...currentSub,
      plan: 'pro',
      status: 'active',
      subscribedAt: new Date().toISOString(),
    };

    const { error } = await supabase.auth.updateUser({
      data: { subscription: JSON.stringify(updated) },
    });

    if (error) {
      setMessage('Error al activar: ' + error.message);
    } else {
      setMessage('✅ Plan Pro activado manualmente');
      setSub(updated);
    }
    setActivating(false);
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />;

  const daysLeft = sub ? getTrialDaysLeft(sub) : 0;
  const active = sub ? isSubscriptionActive(sub) : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Estado</span>
        <Badge className={active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}>
          {active ? 'Activo' : 'Vencido'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Plan</span>
        <span className="text-sm font-medium text-white capitalize">{sub?.plan || 'trial'}</span>
      </div>
      {sub?.plan === 'trial' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Trial</span>
          <span className="text-sm text-zinc-300">{daysLeft} días restantes</span>
        </div>
      )}
      <Separator className="bg-zinc-800" />
      <p className="text-xs text-zinc-500">
        Mientras no integres Mercado Pago, podés activar el plan Pro manualmente:
      </p>
      <Button
        onClick={activatePro}
        disabled={activating || sub?.plan === 'pro'}
        className="w-full bg-sky-600 text-white hover:bg-sky-700"
      >
        {activating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {sub?.plan === 'pro' ? '✅ Plan Pro activado' : 'Activar Plan Pro (manual)'}
      </Button>
      {message && <p className="text-xs text-zinc-400">{message}</p>}
    </div>
  );
}

