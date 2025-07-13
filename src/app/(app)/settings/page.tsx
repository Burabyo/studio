"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency, RecurringContribution } from "@/context/currency-context";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const contributionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  percentage: z.coerce.number().min(0, "Percentage must be non-negative.").max(100, "Percentage cannot exceed 100."),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

function ContributionForm({ setDialogOpen, onSubmit, contribution }: { setDialogOpen: (open: boolean) => void; onSubmit: (values: ContributionFormValues) => void; contribution: RecurringContribution | null }) {
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: contribution || { name: "", percentage: 0 },
  });

  const handleSubmit = (values: ContributionFormValues) => {
    onSubmit(values);
    setDialogOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Health Insurance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentage (%)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit">{contribution ? "Save Changes" : "Add Contribution"}</Button>
        </div>
      </form>
    </Form>
  );
}


export default function SettingsPage() {
  const { currency, setCurrency, taxRate, setTaxRate, recurringContributions, addContribution, editContribution, deleteContribution, payslipInfo, setPayslipInfo } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedContribution, setSelectedContribution] = React.useState<{ contribution: RecurringContribution, index: number } | null>(null);

  const handleAddContribution = (values: ContributionFormValues) => {
    addContribution(values);
    toast({ title: "Contribution Added" });
  };

  const handleEditContribution = (values: ContributionFormValues) => {
    if (selectedContribution) {
      editContribution(selectedContribution.index, values);
      toast({ title: "Contribution Updated" });
    }
  };

  const handleDeleteContribution = (index: number) => {
    deleteContribution(index);
    toast({ title: "Contribution Deleted", variant: "destructive" });
  };
  
  const openEditDialog = (contribution: RecurringContribution, index: number) => {
    setSelectedContribution({ contribution, index });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setSelectedContribution(null);
    setIsDialogOpen(true);
  }

  const handlePayslipInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayslipInfo({
        ...payslipInfo,
        [e.target.name]: e.target.value
    });
  }

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings, tax brackets, and contributions.
        </p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Application Configuration</CardTitle>
            <CardDescription>Configure the default currency for the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
             <RadioGroup 
                defaultValue={currency} 
                onValueChange={(value) => setCurrency(value as 'USD' | 'RWF')}
                className="flex items-center space-x-4"
              >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd">USD ($)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RWF" id="rwf" />
                <Label htmlFor="rwf">RWF (FRw)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Payslip Template</CardTitle>
              <CardDescription>Customize the branding and contact information on generated payslips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" name="companyName" value={payslipInfo.companyName} onChange={handlePayslipInfoChange} placeholder="e.g., PayPulse Inc."/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="companyTagline">Company Tagline / Header</Label>
                  <Input id="companyTagline" name="companyTagline" value={payslipInfo.companyTagline} onChange={handlePayslipInfoChange} placeholder="e.g., Your Trusted Payroll Partner"/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="companyContact">Contact Information</Label>
                  <Input id="companyContact" name="companyContact" value={payslipInfo.companyContact} onChange={handlePayslipInfoChange} placeholder="e.g., contact@paypulse.com | +1 234 567 890"/>
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>Set tax rates and manage recurring employee contributions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Flat Tax Rate (%)</Label>
            <Input 
              id="tax-rate" 
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="max-w-xs"
              placeholder="e.g., 20"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Recurring Contributions</Label>
              <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                  setSelectedContribution(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={openNewDialog}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{selectedContribution ? "Edit Contribution" : "Add New Contribution"}</DialogTitle>
                  </DialogHeader>
                  <ContributionForm 
                    setDialogOpen={setIsDialogOpen}
                    onSubmit={selectedContribution ? handleEditContribution : handleAddContribution}
                    contribution={selectedContribution?.contribution || null}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringContributions.map((c, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.percentage}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(c, index)}>
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
                                    This action cannot be undone. This will permanently delete this contribution.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteContribution(index)}>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
