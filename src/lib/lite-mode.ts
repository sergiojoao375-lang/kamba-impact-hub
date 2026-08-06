import { useEffect, useState } from "react";

const KEY = "kamba:lite-mode";
const EVENT = "kamba:lite-mode-change";

export function getLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setLiteMode(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, value ? "1" : "0");
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

/** Modo Poupança de Dados: substitui gráficos por tabelas textuais de alto contraste. */
export function useLiteMode(): [boolean, (v: boolean) => void] {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    setLite(getLiteMode());
    const onChange = () => setLite(getLiteMode());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return [lite, setLiteMode];
}
