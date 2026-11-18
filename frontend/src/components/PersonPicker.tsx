import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  fetchPersonasSugeridas,
  pinPersona,
  unpinPersona,
  type PersonaSugerida,
  type PersonasSugeridas,
} from "../api/perfil";
import { IconChevronDown, IconPin, IconPinOff } from "./icons";
import { useToast } from "./toast/ToastContext";

export type PersonPickValue = {
  nombre: string;
  orcid?: string;
  instancia?: string;
  cedula?: string;
  idUsuario?: number | null;
  iniciales?: string;
};

function initialsFromName(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 10);
}

function etiquetaHumana(etiqueta: string) {
  if (etiqueta === "usted") return "usted";
  if (etiqueta === "pineado") return "pineado";
  if (etiqueta === "colaborador anterior") return "colaborador anterior";
  if (etiqueta === "catalogo") return "catálogo TEC";
  return etiqueta;
}

type Props = {
  label: string;
  ariaLabel?: string;
  value: string;
  onChangeNombre: (nombre: string) => void;
  onPick: (person: PersonPickValue) => void;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  /** Incluir catálogo TEC completo (recomendado para equipo TEC). */
  includeCatalog?: boolean;
};

export function PersonPicker({
  label,
  ariaLabel,
  value,
  onChangeNombre,
  onPick,
  readOnly,
  maxLength = 150,
  placeholder,
  includeCatalog = true,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PersonasSugeridas | null>(null);
  const [query, setQuery] = useState("");
  const [pinBusy, setPinBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPersonasSugeridas()
      .then((rows) => {
        if (active) setData(rows);
      })
      .catch(() => {
        if (active) setData(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = useMemo(() => {
    if (!data) return [] as PersonaSugerida[];
    const merged: PersonaSugerida[] = [];
    if (data.usted) merged.push(data.usted);
    for (const p of data.pineados) merged.push(p);
    for (const p of data.anteriores) {
      if (
        !merged.some(
          (m) =>
            (m.idUsuario && p.idUsuario && m.idUsuario === p.idUsuario) ||
            m.nombre.toLowerCase() === p.nombre.toLowerCase(),
        )
      ) {
        merged.push(p);
      }
    }
    if (includeCatalog) {
      for (const p of data.catalogo) {
        if (
          !merged.some(
            (m) =>
              (m.idUsuario && p.idUsuario && m.idUsuario === p.idUsuario) ||
              m.nombre.toLowerCase() === p.nombre.toLowerCase(),
          )
        ) {
          merged.push({ ...p, etiqueta: "catalogo" });
        }
      }
    }
    const q = (query || value).trim().toLowerCase();
    if (!q) return merged.slice(0, 12);
    return merged
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.instancia ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [data, includeCatalog, query, value]);

  function select(person: PersonaSugerida) {
    onPick({
      nombre: person.nombre,
      orcid: person.orcid ?? "",
      instancia: person.instancia ?? "",
      cedula: person.cedula ?? "",
      idUsuario: person.idUsuario ?? null,
      iniciales: initialsFromName(person.nombre),
    });
    setQuery("");
    setOpen(false);
  }

  function personKey(person: PersonaSugerida) {
    return `${person.etiqueta}-${person.contactoId ?? person.idUsuario ?? person.nombre}`;
  }

  async function togglePin(person: PersonaSugerida) {
    const key = personKey(person);
    setPinBusy(key);
    try {
      if (person.etiqueta === "pineado" && person.contactoId) {
        await unpinPersona(person.contactoId);
        showToast(`Se quitó el pin de «${person.nombre}»`, "success");
      } else {
        await pinPersona({
          nombre: person.nombre,
          orcid: person.orcid,
          instancia: person.instancia,
          idUsuario: person.idUsuario,
        });
        showToast(`«${person.nombre}» pineado para acceso rápido`, "success");
      }
      setData(await fetchPersonasSugeridas());
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "No se pudo actualizar el pin",
        "error",
      );
    } finally {
      setPinBusy(null);
    }
  }

  return (
    <div className="person-picker field" ref={wrapRef}>
      <span className="field-label">{label}</span>
      <div className="person-picker-control">
        <input
          className="input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={ariaLabel ?? label}
          value={value}
          readOnly={readOnly}
          maxLength={maxLength}
          placeholder={placeholder ?? "Escribí o seleccioná una persona…"}
          onChange={(e) => {
            onChangeNombre(e.target.value);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {!readOnly && (
          <button
            type="button"
            className="person-picker-toggle"
            aria-label={open ? "Ocultar sugerencias" : "Mostrar personas sugeridas"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`person-picker-chevron${open ? " open" : ""}`} aria-hidden>
              <IconChevronDown size={18} />
            </span>
          </button>
        )}
      </div>
      {open && !readOnly && (
        <ul id={listId} className="person-picker-list" role="listbox">
          {options.length === 0 ? (
            <li className="person-picker-empty">
              Sin coincidencias · podés escribir el nombre
            </li>
          ) : (
            options.map((person, index) => {
              const key = `${personKey(person)}-${index}`;
              const busyKey = personKey(person);
              const pinned = person.etiqueta === "pineado";
              const canPin = person.etiqueta !== "usted";
              return (
                <li key={key} role="option">
                  <button
                    type="button"
                    className="person-picker-option"
                    onClick={() => select(person)}
                  >
                    <strong>
                      {person.nombre}
                      <span className="person-picker-tag">
                        {" "}
                        ({etiquetaHumana(person.etiqueta)})
                      </span>
                    </strong>
                    {person.instancia && <span>{person.instancia}</span>}
                  </button>
                  {canPin && (
                    <button
                      type="button"
                      className={`btn btn-ghost person-picker-pin${pinned ? " pinned" : ""}`}
                      title={pinned ? "Quitar pin" : "Pinear para acceso rápido"}
                      aria-label={
                        pinned
                          ? `Quitar pin de ${person.nombre}`
                          : `Pinear ${person.nombre}`
                      }
                      aria-pressed={pinned}
                      disabled={pinBusy === busyKey}
                      onClick={() => void togglePin(person)}
                    >
                      {pinned ? <IconPinOff size={16} /> : <IconPin size={16} />}
                    </button>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
