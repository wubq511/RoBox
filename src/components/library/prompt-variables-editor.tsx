"use client";

import { useId, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export function PromptVariablesEditor({
  initialVariables = [],
}: Readonly<PromptVariablesEditorProps>) {
  const inputId = useId();
  const [variables, setVariables] = useState<EditableVariable[]>(initialVariables);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">变量</h3>
          <p className="text-xs text-muted-foreground">
            Prompt 可以不包含变量直接保存。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setVariables((current) => [...current, { ...emptyVariable }]);
          }}
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
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          暂无变量。普通 Prompt 仍可保存和复制。
        </div>
      ) : (
        <div className="space-y-3">
          {variables.map((variable, index) => (
            <div
              key={`${inputId}-${index}`}
              className="space-y-3 rounded-xl border border-border/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="rounded-full px-2.5">
                  变量 {index + 1}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setVariables((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    );
                  }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-foreground">名称</span>
                  <Input
                    value={variable.name}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setVariables((current) =>
                        current.map((entry, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...entry,
                                name: nextValue,
                              }
                            : entry,
                        ),
                      );
                    }}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-foreground">
                    默认值
                  </span>
                  <Input
                    value={variable.defaultValue}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setVariables((current) =>
                        current.map((entry, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...entry,
                                defaultValue: nextValue,
                              }
                            : entry,
                        ),
                      );
                    }}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-medium text-foreground">
                  描述
                </span>
                <Input
                  value={variable.description}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setVariables((current) =>
                      current.map((entry, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...entry,
                              description: nextValue,
                            }
                          : entry,
                      ),
                    );
                  }}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={variable.required}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.checked;
                    setVariables((current) =>
                      current.map((entry, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...entry,
                              required: nextValue,
                            }
                          : entry,
                      ),
                    );
                  }}
                />
                必填
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
