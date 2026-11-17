"use client";

import { Header, Label, ListBox, Select } from "@heroui/react";
import type { Key } from "@heroui/react";
import { cn } from "@/lib/utils";

export type SelectOption = { id: string; label: string };
export type SelectGroup = { label: string; options: SelectOption[] };

type Props = {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  isDisabled?: boolean;
  /** Show the × button once something is picked. Default true. */
  clearable?: boolean;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  /**
   * Adds a first item that means "no filter", e.g. "All Nigeria" or "Any brand".
   * Picking it clears the value. It shows as selected (with a tick) while nothing else is picked.
   */
  anyOption?: string;
  className?: string;
};

/** Internal id for the "any" item; never submitted (an empty choice sends nothing). */
const ANY = "__any__";

/** Lists longer than this get a fade at the bottom as a hint that there's more to scroll. */
const LONG_LIST = 7;

function Item({ option }: { option: SelectOption }) {
  return (
    <ListBox.Item
      id={option.id}
      textValue={option.label}
      className="rounded-lg px-3 py-2.5 text-sm text-ink-3 data-[focused=true]:bg-sand data-[hovered=true]:bg-sand data-[selected=true]:font-semibold data-[selected=true]:text-ink"
    >
      {option.label}
      <ListBox.ItemIndicator className="text-ink" />
    </ListBox.Item>
  );
}

/**
 * Rezlify-styled HeroUI Select. Works inside plain forms (the `name` is submitted),
 * can show a clear button once something is picked, supports grouped options,
 * and an optional "All …" item at the top.
 */
export function FilterSelect({
  label,
  name,
  placeholder,
  value,
  onChange,
  options,
  groups,
  isDisabled,
  clearable = true,
  hideLabel,
  anyOption,
  className,
}: Props) {
  const total = (options?.length ?? 0) + (groups?.reduce((n, g) => n + g.options.length + 1, 0) ?? 0) + (anyOption ? 1 : 0);
  const selected = value || (anyOption ? ANY : null);

  return (
    <>
      <Select
        placeholder={placeholder}
        value={selected}
        onChange={(next) => {
          const key = next == null ? "" : String(next as Key);
          onChange(key === ANY ? "" : key);
        }}
        isDisabled={isDisabled}
        className={cn("w-full", className)}
      >
        <Label className={hideLabel ? "sr-only" : "mb-1.5 block text-xs font-semibold text-muted"}>{label}</Label>

        <Select.Trigger className="flex h-11 w-full items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3 text-left text-sm text-ink shadow-none transition-colors hover:border-ink/25 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-sand data-[disabled=true]:text-subtle data-[focus-visible=true]:border-ink/40 data-[focus-visible=true]:ring-4 data-[focus-visible=true]:ring-ink/5">
          <Select.Value className="min-w-0 flex-1 truncate data-[placeholder=true]:text-subtle" />
          {clearable && value ? <Select.ClearButton className="text-subtle hover:text-ink" /> : null}
          <Select.Indicator className="text-subtle" />
        </Select.Trigger>

        <Select.Popover
          className={cn(
            "relative z-[80] min-w-[var(--trigger-width)] overflow-hidden rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-lift)]",
            // A soft fade at the bottom of long lists says "scroll for more".
            total > LONG_LIST &&
              "after:pointer-events-none after:absolute after:inset-x-1 after:bottom-1 after:h-8 after:rounded-b-lg after:bg-gradient-to-t after:from-card after:to-transparent",
          )}
        >
          <ListBox className="scrollbar-visible max-h-72 overflow-y-auto pb-2 pr-0.5 outline-none">
            {anyOption ? <Item option={{ id: ANY, label: anyOption }} /> : null}
            {groups
              ? groups.map((group) => (
                  <ListBox.Section key={group.label}>
                    <Header className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">
                      {group.label}
                    </Header>
                    {group.options.map((o) => (
                      <Item key={o.id} option={o} />
                    ))}
                  </ListBox.Section>
                ))
              : options?.map((o) => <Item key={o.id} option={o} />)}
          </ListBox>
        </Select.Popover>
      </Select>

      {/* Submitted with plain forms. Nothing is sent for "All …", so the search isn't filtered. */}
      {value ? <input type="hidden" name={name} value={value} /> : null}
    </>
  );
}
