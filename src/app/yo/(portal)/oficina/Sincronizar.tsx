"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderSync, Loader2 } from "lucide-react";
import { procesarVault, type ArchivoVault } from "@/lib/yo/vault";
import { guardarNotas, podarVault } from "./acciones";

// Sincroniza el vault desde el navegador: el usuario elige la carpeta del vault
// (Chrome/Edge recuerdan la elección; en otros navegadores se elige cada vez),
// se leen los .md acá mismo y se suben procesados en lotes.

type Permiso = "granted" | "denied" | "prompt";
type Entrada = { kind: "file" | "directory"; name: string };
type Archivo = Entrada & { kind: "file"; getFile(): Promise<File> };
type Carpeta = Entrada & {
  kind: "directory";
  values(): AsyncIterable<Archivo | Carpeta>;
  queryPermission(o: { mode: "read" }): Promise<Permiso>;
  requestPermission(o: { mode: "read" }): Promise<Permiso>;
};
type ConSelector = Window & { showDirectoryPicker?: (o: { id?: string; mode?: "read" }) => Promise<Carpeta> };

const LOTE = 25;

// ---- Recordar la carpeta (IndexedDB guarda el "handle", no el contenido) ----

function base(): Promise<IDBDatabase> {
  return new Promise((ok, mal) => {
    const r = indexedDB.open("oficina-virtual", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("carpetas");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
}

async function leerCarpetaGuardada(): Promise<Carpeta | null> {
  try {
    const db = await base();
    return await new Promise((ok) => {
      const r = db.transaction("carpetas").objectStore("carpetas").get("vault");
      r.onsuccess = () => ok((r.result as Carpeta) ?? null);
      r.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}

async function guardarCarpeta(c: Carpeta | null) {
  try {
    const db = await base();
    const tx = db.transaction("carpetas", "readwrite");
    if (c) tx.objectStore("carpetas").put(c, "vault");
    else tx.objectStore("carpetas").delete("vault");
  } catch {
    // Sin IndexedDB (modo privado): simplemente se pedirá la carpeta cada vez.
  }
}

async function leerDesdeCarpeta(raiz: Carpeta): Promise<{ archivos: ArchivoVault[]; esVault: boolean }> {
  const archivos: ArchivoVault[] = [];
  let esVault = false;
  async function recorrer(dir: Carpeta, prefijo: string) {
    for await (const e of dir.values()) {
      if (e.kind === "directory") {
        if (e.name === ".obsidian" && !prefijo) esVault = true;
        if (e.name.startsWith(".") || e.name === "_Recursos" || e.name === "node_modules") continue;
        await recorrer(e, `${prefijo}${e.name}/`);
      } else if (e.name.endsWith(".md")) {
        const f = await e.getFile();
        archivos.push({ ruta: `${prefijo}${e.name}`, texto: await f.text(), modificado: f.lastModified });
      }
    }
  }
  await recorrer(raiz, "");
  return { archivos, esVault };
}

async function leerDesdeInput(lista: FileList): Promise<{ archivos: ArchivoVault[]; esVault: boolean }> {
  const archivos: ArchivoVault[] = [];
  let esVault = false;
  for (const f of Array.from(lista)) {
    // webkitRelativePath = "Obsidian Vault/03 - Proyectos/TAMP.md": se quita la carpeta raíz.
    const ruta = f.webkitRelativePath.split("/").slice(1).join("/");
    if (ruta.startsWith(".obsidian/")) esVault = true;
    if (ruta.endsWith(".md")) archivos.push({ ruta, texto: await f.text(), modificado: f.lastModified });
  }
  return { archivos, esVault };
}

export default function Sincronizar({ grande = false }: { grande?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"listo" | "trabajando" | "ok" | "error" | "sin-selector">("listo");
  const [mensaje, setMensaje] = useState("");

  async function subir(leido: { archivos: ArchivoVault[]; esVault: boolean }) {
    // Freno de seguridad: sincronizar borra lo que no está en la carpeta, así que
    // una carpeta equivocada vaciaría la oficina.
    if (!leido.esVault) throw new Error("Esa carpeta no es un vault de Obsidian (no tiene .obsidian). Elige la carpeta raíz del vault.");
    const notas = procesarVault(leido.archivos);
    if (!notas.length) throw new Error("No encontré notas en esa carpeta.");

    for (let i = 0; i < notas.length; i += LOTE) {
      setMensaje(`Subiendo notas… ${Math.min(i + LOTE, notas.length)} de ${notas.length}`);
      const r = await guardarNotas(notas.slice(i, i + LOTE));
      if (r.error) throw new Error(r.error);
    }
    const r = await podarVault(notas.map((n) => n.ruta));
    if (r.error) throw new Error(r.error);

    setEstado("ok");
    setMensaje(`${notas.length} notas al día${r.borradas ? ` · ${r.borradas} quitadas` : ""}`);
    router.refresh();
  }

  async function sincronizar(otraCarpeta = false) {
    setEstado("trabajando");
    setMensaje("Leyendo el vault…");
    try {
      const selector = (window as ConSelector).showDirectoryPicker;
      if (!selector) {
        setEstado("listo");
        setMensaje("");
        input.current?.click();
        return;
      }
      let carpeta = otraCarpeta ? null : await leerCarpetaGuardada();
      if (carpeta) {
        let permiso = await carpeta.queryPermission({ mode: "read" });
        if (permiso !== "granted") permiso = await carpeta.requestPermission({ mode: "read" });
        if (permiso !== "granted") carpeta = null;
      }
      if (!carpeta) {
        const inicio = performance.now();
        try {
          carpeta = await selector({ id: "vault-obsidian", mode: "read" });
        } catch (e) {
          // Algunos navegadores embebidos (p. ej. el de la app de Claude) traen la
          // función pero cancelan al instante sin mostrar diálogo. Nadie cancela en
          // medio segundo: se ofrece el selector clásico, que necesita otro clic.
          if (e instanceof DOMException && e.name === "AbortError" && performance.now() - inicio < 500) {
            setEstado("sin-selector");
            setMensaje("Este navegador no abrió el selector moderno. Usa el selector clásico:");
            return;
          }
          throw e;
        }
        await guardarCarpeta(carpeta);
      }
      setMensaje("Leyendo el vault…");
      await subir(await leerDesdeCarpeta(carpeta));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setEstado("listo");
        setMensaje("");
        return;
      }
      setEstado("error");
      setMensaje(e instanceof Error ? e.message : "No se pudo sincronizar.");
    }
  }

  async function alElegir(lista: FileList | null) {
    if (!lista?.length) return;
    setEstado("trabajando");
    setMensaje("Leyendo el vault…");
    try {
      await subir(await leerDesdeInput(lista));
    } catch (e) {
      setEstado("error");
      setMensaje(e instanceof Error ? e.message : "No se pudo sincronizar.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const trabajando = estado === "trabajando";

  return (
    <div className={`flex flex-col gap-1.5 ${grande ? "items-center" : "items-start sm:items-end"}`}>
      <button
        type="button"
        onClick={() => sincronizar()}
        disabled={trabajando}
        className={`inline-flex items-center gap-2 rounded-full font-medium transition-colors disabled:opacity-60 ${
          grande
            ? "bg-indigo-400 px-6 py-3 text-[#05060f] hover:bg-indigo-300"
            : "border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur hover:bg-white/10"
        }`}
      >
        {trabajando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" strokeWidth={1.5} />}
        {trabajando ? "Sincronizando…" : "Sincronizar vault"}
      </button>
      {mensaje && (
        <p role="status" className={`max-w-xs text-xs ${estado === "error" ? "text-rose-300" : "text-slate-400"} ${grande ? "text-center" : "sm:text-right"}`}>
          {mensaje}
        </p>
      )}
      {estado === "error" && (
        <button type="button" onClick={() => sincronizar(true)} className="text-xs text-indigo-300 underline-offset-2 hover:underline">
          Elegir otra carpeta
        </button>
      )}
      {estado === "sin-selector" && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="rounded-full border border-indigo-300/40 px-4 py-1.5 text-sm text-indigo-200 transition-colors hover:bg-indigo-300/10"
        >
          Elegir carpeta del vault
        </button>
      )}
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => alElegir(e.target.files)}
        {...{ webkitdirectory: "", directory: "" }}
      />
    </div>
  );
}
