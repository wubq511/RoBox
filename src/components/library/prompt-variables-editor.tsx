"use client";

import { useId, useState, useRef, useCallback } from "react";
import { PlusIcon, Trash2Icon, VariableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { PromptVariable } from "@/features/items/types";

type PromptVariablesEditorProps = {
  initialVariables?: PromptVariable[];
};

type EditableVariable = PromptVariable;

function normalizeVariables(variables: EditableVariable[]) {
  return variables.map((variable, index) => ({
    ...variable,
    sortOrder: index,
  }));
}

const emptyVariable: EditableVariable = {
  name: "",
  description: "",
  defaultValue: "",
  required: false,
};

function VariableCard({
  variable,
  index,
  onChange,
  onRemove,
  inputRef,
}: {
  variable: EditableVariable;
  index: number;
  onChange: (index: number, updates: Partial<EditableVariable>) => void;
  onRemove: (index: number) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm transition-all hover:shadow-md hover:border-border/80">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {variable.name || "未命名变量"}
          </span>
          {variable.required && (
            <span className="text-xs text-destructive font-medium">必填</span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            名称
          </label>
          <Input
            ref={index === 0 ? inputRef : undefined}
            value={variable.name}
            placeholder="如：topic"
            className="h-10 text-sm"
            onChange={(event) => {
              onChange(index, { name: event.currentTarget.value });
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            默认值
          </label>
          <Input
            value={variable.defaultValue}
            placeholder="可选"
            className="h-10 text-sm"
            onChange={(event) => {
              onChange(index, { defaultValue: event.currentTarget.value });
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          描述
        </label>
        <Input
          value={variable.description}
          placeholder="说明这个变量的用途"
          className="h-10 text-sm"
          onChange={(event) => {
            onChange(index, { description: event.currentTarget.value });
          }}
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={variable.required}
          onChange={(event) => {
            onChange(index, { required: event.currentTarget.checked });
          }}
          className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-sm text-foreground">必填</span>
      </label>
    </div>
  );
}

export function PromptVariablesEditor({
  initialVariables = [],
}: Readonly<PromptVariablesEditorProps>) {
  const inputId = useId();
  const [variables, setVariables] = useState<EditableVariable[]>(initialVariables);
  const newInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = useCallback(
    (index: number, updates: Partial<EditableVariable>) => {
      setVariables((current) =>
        current.map((entry, currentIndex) =>
          currentIndex === index ? { ...entry, ...updates } : entry,
        ),
      );
    },
    [],
  );

  const handleRemove = useCallback((index: number) => {
    setVariables((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }, []);

  const handleAdd = useCallback(() => {
    setVariables((current) => [...current, { ...emptyVariable }]);
    setTimeout(() => {
      newInputRef.current?.focus();
    }, 0);
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">变量</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5"
        >
          <PlusIcon className="size-4" />
          添加变量
        </Button>
      </div>

      <input
        type="hidden"
        id={inputId}
        name="variables"
        value={JSON.stringify(normalizeVariables(variables))}
        readOnly
      />

      {variables.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center transition-all hover:border-primary/40 hover:bg-muted/50"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
            <VariableIcon className="size-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            添加变量
          </p>
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
            点击此处添加变量，或在内容中使用 {"{{变量名}}"} 自动识别
          </p>
        </button>
      ) : (
        <div className="space-y-4">
          {variables.map((variable, index) => (
            <VariableCard
              key={`${inputId}-${index}`}
              variable={variable}
              index={index}
              onChange={handleChange}
              onRemove={handleRemove}
              inputRef={
                index === variables.length - 1 ? (el) => { newInputRef.current = el; } : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
