import React, { useState } from "react";
import { TimerData } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimerComponentProps = {
  initialValue: TimerData | null;
  submit: (value: TimerData) => void;
};

export default function TimerComponent({
  initialValue,
  submit,
}: TimerComponentProps) {
  const [count, setCount] = useState(initialValue?.count || 0);
  const [unit, setUnit] = useState<"Days" | "Hours">(
    initialValue?.unit || "Days"
  );

  const handleSubmit = () => {
    submit({
      label: "Delay",
      count,
      unit,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="count">Delay Count</Label>
        <Input
          id="count"
          type="number"
          min="0"
          value={count}
          onChange={e => setCount(parseInt(e.target.value) || 0)}
        />
      </div>

      <div>
        <Label htmlFor="unit">Delay Unit</Label>
        <Select
          value={unit}
          onValueChange={(value: "Days" | "Hours") => setUnit(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hours">Hours</SelectItem>
            <SelectItem value="Days">Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => submit({ label: "Delay", count, unit })}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </div>
  );
}
