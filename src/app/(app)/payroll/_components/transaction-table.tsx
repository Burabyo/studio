
"use client";

import * as React from "react";
import type { Transaction } from "@/lib/types";
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
import { MoreHorizontal, Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEmployeeContext } from "@/context/employee-context";
import { useTransactionContext } from "@/context/transaction-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";

const statusColors = {
  Pending: "bg-yellow-500 hover:bg-yellow-500/80",
  Approved: "bg-blue-500 hover:bg-blue-500/80",
  Paid: "bg-green-500 hover:bg-green-500/80",
  Rejected: "bg-red-500 hover:bg-red-500/80",
};

export function TransactionTable() {
  const { employees } = useEmployeeContext();
  const { transactions, addTransaction, editTransaction, deleteTransaction, loading } = useTransactionContext();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    await addTransaction(transaction);
    toast({
      title: "Transaction Added",
      description: `The transaction for ${transaction.employeeName} has been recorded.`,
    });
    setIsDialogOpen(false);
  };
  
  const handleEditTransaction = async (transaction: Transaction) => {
    await editTransaction(transaction);
    toast({
        title: "Transaction Updated",
        description: `The transaction for ${transaction.employeeName} has been updated.`,
    });
    setIsDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId);
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

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
    <div className="flex justify-end">
       {canManage && (
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
        )}
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
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center">
                        No transactions found. Add one to get started.
                    </TableCell>
                </TableRow>
            ) : (
            transactions.map((transaction) => (
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
                  {formatCurrency(transaction.amount)}
                </TableCell>
                {canManage && (
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
                        {user?.role === 'admin' && (
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
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
