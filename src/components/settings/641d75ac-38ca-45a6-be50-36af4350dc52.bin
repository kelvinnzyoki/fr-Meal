"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Address } from "@/types";
import { account } from "@/lib/account";
import { Button, Card, Field, Notice, errorText, type Status } from "./ui";

const optional = (v: string) => (v.trim() ? v.trim() : undefined);

function describe(a: Address) {
  return [a.building, a.street, a.area, a.city].filter(Boolean).join(", ");
}

export function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAddresses(await account.listAddresses());
    } catch (err) {
      setAddresses([]);
      setStatus({ kind: "error", text: errorText(err) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function makeDefault(id: string) {
    setBusyId(id);
    setStatus(null);
    try {
      await account.setDefaultAddress(id);
      await load();
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setStatus(null);
    try {
      await account.deleteAddress(id);
      setConfirmingId(null);
      await load();
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setBusyId(null);
    }
  }

  const sorted = (addresses ?? []).slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <Card title="Saved addresses" description="Places you order to. Your default is used first at checkout.">
      {addresses === null ? (
        <p className="text-sm text-stone">Loading…</p>
      ) : sorted.length === 0 && !adding ? (
        <p className="text-sm text-stone">You haven&apos;t saved an address yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((a) => (
            <li key={a.id} className="rounded-card border border-black/10 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {a.label}
                    {a.isDefault && (
                      <span className="ml-2 align-middle text-xs font-medium bg-marigold text-ink rounded-full px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </p>
                  {describe(a) && <p className="text-sm text-stone break-words">{describe(a)}</p>}
                  {a.landmark && <p className="text-sm text-stone break-words">Near {a.landmark}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {confirmingId === a.id ? (
                    <div className="flex gap-2">
                      <Button variant="danger" className="!px-3 !py-1.5" onClick={() => remove(a.id)} loading={busyId === a.id}>
                        Remove
                      </Button>
                      <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setConfirmingId(null)} disabled={busyId === a.id}>
                        Keep
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!a.isDefault && (
                        <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => makeDefault(a.id)} loading={busyId === a.id}>
                          Make default
                        </Button>
                      )}
                      <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setConfirmingId(a.id)} disabled={busyId === a.id}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {status && (
        <div className="mt-3">
          <Notice status={status} />
        </div>
      )}

      <div className="mt-4">
        {adding ? (
          <AddAddressForm
            isFirst={sorted.length === 0}
            onCancel={() => setAdding(false)}
            onSaved={async () => {
              setAdding(false);
              setStatus({ kind: "success", text: "Address saved." });
              await load();
            }}
          />
        ) : (
          <Button variant="secondary" onClick={() => { setStatus(null); setAdding(true); }}>
            Add address
          </Button>
        )}
      </div>
    </Card>
  );
}

function AddAddressForm({
  isFirst,
  onSaved,
  onCancel,
}: {
  isFirst: boolean;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("Home");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Nairobi");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(isFirst);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus({ kind: "error", text: "This browser can't share your location." });
      return;
    }
    setLocating(true);
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setStatus({ kind: "error", text: "Couldn't get your location. Allow location access in your browser and try again." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setStatus({ kind: "error", text: "Give this address a label, like Home or Office." });
      return;
    }
    if (!coords) {
      setStatus({ kind: "error", text: "Pin the delivery location first." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await account.createAddress({
        label: label.trim(),
        building: optional(building),
        street: optional(street),
        area: optional(area),
        city: optional(city),
        landmark: optional(landmark),
        latitude: coords.lat,
        longitude: coords.lng,
        isDefault,
      });
      await onSaved();
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-black/10 p-4 space-y-4 bg-black/[0.02]">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Office…" required />
        <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Field label="Building or house" value={building} onChange={(e) => setBuilding(e.target.value)} />
        <Field label="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
        <Field label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Kilimani, Westlands…" />
        <Field label="Landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Opposite the petrol station" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={useMyLocation} loading={locating}>
          {coords ? "Update pinned location" : "Use my current location"}
        </Button>
        {coords && <span className="text-sm text-green-700">Location pinned.</span>}
      </div>
      <p className="text-xs text-stone -mt-2">
        Riders navigate to the pinned point, so be at the delivery spot when you tap this.
      </p>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-marigold h-4 w-4" />
        Make this my default address
      </label>

      <Notice status={status} />

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          Save address
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
