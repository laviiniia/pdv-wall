"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Consulta uma URL de tempos em tempos (pausa com a aba em segundo plano).
 * É o ponto único de "tempo real" do app: quando houver Supabase Realtime,
 * basta trocar a implementação deste hook por uma assinatura de mudanças.
 */
export function useAtualizacao<T>(url: string, inicial: T, intervaloMs = 5000) {
  const [dados, setDados] = useState<T>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const emAndamento = useRef(false);
  const router = useRouter();

  const atualizar = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      setDados(await r.json());
      setErro(null);
      setAtualizadoEm(new Date());
    } catch {
      setErro("Sem conexão. Tentando de novo...");
    } finally {
      emAndamento.current = false;
    }
  }, [url, router]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const iniciar = () => {
      clearInterval(id);
      id = setInterval(() => {
        if (document.visibilityState === "visible") void atualizar();
      }, intervaloMs);
    };
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void atualizar();
    };
    iniciar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [atualizar, intervaloMs]);

  return { dados, erro, atualizadoEm, atualizar };
}
