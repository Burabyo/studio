"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { secondaryAuth } from "@/lib/firebase-secondary";
import { createUserWithEmailAndPassword } from "firebase/auth";

// --------------------
// Types
// --------------------
export type EmploymentType = "Monthly Salary" | "Daily Wages";
export type Role = "employee" | "manager";

export interface EmployeeFormValues {
  id: string;
  name: string;
  jobTitle: string;
  employmentType: EmploymentType;
  salary: number;
  bankName: string;
  accountNumber: string;
  role: Role;
  email: string;
  password?: string;
}

export type EmployeeWithId = EmployeeFormValues & { _id?: string };

// --------------------
// Props
// --------------------
interface EmployeeFormProps {
  employee?: EmployeeWithId | null;
  setDialogOpen: (val: boolean) => void;
}

// --------------------
// EmployeeForm Component
// --------------------
export function EmployeeForm({ employee, setDialogOpen }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    defaultValues: {
      id: "",
      name: "",
      jobTitle: "",
      employmentType: "Monthly Salary",
      salary: 0,
      bankName: "",
      accountNumber: "",
      role: "employee",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        ...employee,
        email: employee.email || "",
        password: "",
      });
    } else {
      form.reset({
        id: `EMP-${uuidv4().substring(0, 4).toUpperCase()}`,
        name: "",
        jobTitle: "",
        employmentType: "Monthly Salary",
        salary: 0,
        bankName: "",
        accountNumber: "",
        role: "employee",
        email: "",
        password: "",
      });
    }
  }, [employee, form]);

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      if (!employee) {
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          values.email,
          values.password || "defaultPassword123"
        );

        await setDoc(doc(db, "employees", cred.user.uid), {
          ...values,
          authUid: cred.user.uid,
          createdAt: new Date(),
        });
        console.log("Employee account created successfully!");
      } else {
        await setDoc(
          doc(db, "employees", employee.id),
          { ...values, updatedAt: new Date() },
          { merge: true }
        );
        console.log("Employee updated successfully!");
      }

      // Close modal after successful create/update
      setDialogOpen(false);
    } catch (err: any) {
      console.error("Error creating/updating employee:", err.message);
      alert(err.message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Input placeholder="Name" {...form.register("name", { required: true })} />
      <Input placeholder="Job Title" {...form.register("jobTitle")} />
      <Select
        onValueChange={(val) =>
          form.setValue("employmentType", val as EmploymentType)
        }
        defaultValue={form.getValues("employmentType")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Employment Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Monthly Salary">Monthly Salary</SelectItem>
          <SelectItem value="Daily Wages">Daily Wages</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Salary"
        {...form.register("salary", { valueAsNumber: true })}
      />
      <Input placeholder="Bank Name" {...form.register("bankName")} />
      <Input placeholder="Account Number" {...form.register("accountNumber")} />
      <Select
        onValueChange={(val) => form.setValue("role", val as Role)}
        defaultValue={form.getValues("role")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employee">Employee</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="email"
        placeholder="Email"
        {...form.register("email", { required: true })}
      />
      {!employee && (
        <Input
          type="password"
          placeholder="Password"
          {...form.register("password", { required: true })}
        />
      )}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit">
          {employee ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}

// --------------------
// Modal Wrapper
// --------------------
interface EmployeeModalProps {
  employee?: EmployeeWithId | null;
}

export function EmployeeModal({ employee }: EmployeeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Use pointerdown in capture phase so we detect clicks even when children call stopPropagation().
  // Also listen for Escape key.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (modalRef.current && target && !modalRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true); // capture = true
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* make sure this button is type="button" so it doesn't submit any parent forms */}
      <Button type="button" onClick={() => setIsOpen(true)}>
        Add Employee
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          aria-modal="true"
          role="dialog"
        >
          {/* stopPropagation here to prevent pointer events from bubbling to document (but our capture listener will still run) */}
          <div
            ref={modalRef}
            className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X button: explicitly type="button" so it's never treated as a submit */}
            <button
              type="button"
              className="absolute top-3 right-3 text-2xl font-bold hover:text-red-500"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              x
            </button>

            <EmployeeForm employee={employee || null} setDialogOpen={setIsOpen} />
          </div>
        </div>
      )}
    </>
  );
}
