
"use client";

import * as React from "react";
import type { Transaction, Employee } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "./transaction-form";
import { Badge } from "@/components/ui/badge";
import { transactions as initialTransactions } from "../data";
import { employees as initialEmployees } from "../../employees/data";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusColors = {
  Pending: "bg-yellow-500 hover:bg-yellow-500/80",
  Approved: "bg-blue-500 hover:bg-blue-500/80",
  Paid: "bg-green-500 hover:bg-green-500/80",
  Rejected: "bg-red-500 hover:bg-red-500/80",
};

export function TransactionTable() {
  const [employees] = React.useState<Employee[]>(initialEmployees);
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions([
        ...transactions, 
        { ...transaction, id: `TRN${(transactions.length + 1).toString().padStart(3, '0')}` }
    ]);
    toast({
      title: "Transaction Added",
      description: `The transaction for ${transaction.employeeName} has been recorded.`,
    });
    setIsDialogOpen(false);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    toast({
        title: "Transaction Updated",
        description: `The transaction for ${transaction.employeeName} has been updated.`,
    });
    setIsDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions(transactions.filter(t => t.id !== transactionId));
     toast({
      title: "Transaction Deleted",
      description: `Transaction has been removed from the system.`,
      variant: "destructive"
    });
  };

  const openEditDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setSelectedTransaction(null);
    setIsDialogOpen(true);
  }

  return (
    <>
    <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedTransaction(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>{selectedTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
            </DialogHeader>
            <TransactionForm 
              setDialogOpen={setIsDialogOpen}
              onSubmit={selectedTransaction ? handleEditTransaction : handleAddTransaction}
              transaction={selectedTransaction}
              employees={employees}
            />
          </DialogContent>
        </Dialog>
      </div>
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{transaction.employeeName} <span className="text-muted-foreground">({transaction.employeeId})</span></TableCell>
                <TableCell>
                  <Badge variant="secondary">{transaction.type}</Badge>
                </TableCell>
                <TableCell className="max-w-[250px] truncate">{transaction.description}</TableCell>
                <TableCell>
                  <Badge className={cn("text-white", statusColors[transaction.status])}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this transaction record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
