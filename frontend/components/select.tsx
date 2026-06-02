

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

type SelectItem = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  items: SelectItem[];
};

export function Select({
  value,
  onValueChange,
  placeholder = 'Sélectionner',
  items,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition hover:bg-white focus:border-[#06475a] focus:bg-white focus:ring-4 focus:ring-[#06475a]/10">
        <SelectPrimitive.Value placeholder={placeholder} />

        <SelectPrimitive.Icon>
          <ChevronDown size={18} className="text-slate-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-[280px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <SelectPrimitive.Viewport className="p-2">
            {items
              .filter((item) => item.value !== '')
              .map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className="relative flex h-11 cursor-pointer select-none items-center rounded-xl px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition data-[highlighted]:bg-[#e8f7fb] data-[highlighted]:text-[#06475a]"
                >
                  <SelectPrimitive.ItemText>
                    {item.label}
                  </SelectPrimitive.ItemText>

                  <SelectPrimitive.ItemIndicator className="absolute right-3">
                    <Check size={16} className="text-[#06475a]" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}