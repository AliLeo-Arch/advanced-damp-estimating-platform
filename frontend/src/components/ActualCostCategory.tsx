import { useState } from "react";
import { ActualCostEntry, formatMoney } from "../api";
import { formatUkDate } from "../locale";

export type ActualCostCategoryKey =
  | "materials"
  | "labour"
  | "waste"
  | "travel"
  | "prelims"
  | "other";

type ActualCostCategoryProps = {
  category: ActualCostCategoryKey;
  label: string;
  inputId: string;
  estimated: number;
  totalValue: string;
  entries: ActualCostEntry[];
  drivenByEntries: boolean;
  disabled?: boolean;
  busy?: boolean;
  onTotalChange: (value: string) => void;
  onAddEntry: (payload: {
    category: ActualCostCategoryKey;
    description: string;
    amount: number;
    occurred_on: string;
    supplier_ref: string;
  }) => Promise<void>;
  onDeleteEntry: (entryId: number) => Promise<void>;
};

export default function ActualCostCategory({
  category,
  label,
  inputId,
  estimated,
  totalValue,
  entries,
  drivenByEntries,
  disabled = false,
  busy = false,
  onTotalChange,
  onAddEntry,
  onDeleteEntry,
}: ActualCostCategoryProps) {
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submitEntry() {
    setLocalError(null);
    const parsed = Number(amount);
    if (!amount.trim() || Number.isNaN(parsed) || parsed < 0) {
      setLocalError("Enter a valid amount.");
      return;
    }
    try {
      await onAddEntry({
        category,
        description: description.trim(),
        amount: parsed,
        occurred_on: occurredOn,
        supplier_ref: supplierRef.trim(),
      });
      setDescription("");
      setAmount("");
      setOccurredOn("");
      setSupplierRef("");
      setAdding(false);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not add cost entry.",
      );
    }
  }

  return (
    <div className="actual-cost-category stack">
      <div className="field">
        <label htmlFor={inputId}>{label} (£)</label>
        <input
          id={inputId}
          type="number"
          min={0}
          step="0.01"
          value={totalValue}
          disabled={disabled || drivenByEntries}
          onChange={(event) => onTotalChange(event.target.value)}
        />
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Estimated: {formatMoney(estimated)}
          {drivenByEntries ? " · total from detailed lines" : ""}
        </p>
      </div>

      {entries.length ? (
        <ul className="actual-entry-list">
          {entries.map((entry) => (
            <li key={entry.id} className="actual-entry-row">
              <div className="actual-entry-copy">
                <strong>
                  {entry.description || "Cost entry"} · {formatMoney(entry.amount)}
                </strong>
                <span className="muted">
                  {[
                    entry.occurred_on
                      ? formatUkDate(entry.occurred_on)
                      : null,
                    entry.supplier_ref || null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No date / supplier"}
                </span>
              </div>
              {!disabled ? (
                <button
                  className="btn btn-secondary btn-compact"
                  type="button"
                  disabled={busy}
                  onClick={() => void onDeleteEntry(entry.id)}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!disabled ? (
        adding ? (
          <div className="actual-entry-form stack">
            {localError ? <div className="error-banner">{localError}</div> : null}
            <div className="row">
              <div className="field">
                <label htmlFor={`${inputId}-desc`}>Description</label>
                <input
                  id={`${inputId}-desc`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Invoice, labour day, hire…"
                />
              </div>
              <div className="field">
                <label htmlFor={`${inputId}-amount`}>Amount (£)</label>
                <input
                  id={`${inputId}-amount`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor={`${inputId}-date`}>Date</label>
                <input
                  id={`${inputId}-date`}
                  type="date"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`${inputId}-supplier`}>Supplier / ref</label>
                <input
                  id={`${inputId}-supplier`}
                  value={supplierRef}
                  onChange={(event) => setSupplierRef(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="step-actions" style={{ justifyContent: "flex-start" }}>
              <button
                className="btn btn-primary btn-compact"
                type="button"
                disabled={busy}
                onClick={() => void submitEntry()}
              >
                Add line
              </button>
              <button
                className="btn btn-secondary btn-compact"
                type="button"
                disabled={busy}
                onClick={() => {
                  setAdding(false);
                  setLocalError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-compact"
            type="button"
            disabled={busy}
            onClick={() => setAdding(true)}
          >
            Add detailed line
          </button>
        )
      ) : null}
    </div>
  );
}
