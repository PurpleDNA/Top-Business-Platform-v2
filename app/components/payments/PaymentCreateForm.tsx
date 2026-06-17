/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Customer, searchCustomers } from "@/app/services/customers";
import React, { useActionState, useEffect, useState } from "react";
import { notify, messages } from "@/lib/notifications";
import z from "zod";
import {
  distributePaymentAcrossSales,
  createPaymentForSale,
} from "@/app/services/payments";
import { Input } from "@/components/ui/input";
import { LoaderCircle, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUnpaidSalesByCustomerId } from "@/app/services/sales";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Production } from "@/app/services/productions";

interface Props {
  customer?: Customer;
  latestProd: Production;
}

const validate = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  amountPaid: z.coerce.number().min(1, "Amount is required"),
  saleId: z.string(),
});

const PaymentCreateForm = ({ customer, latestProd }: Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState({
    customer: customer || undefined,
    sale: undefined as any,
  });
  const [payload, setPayload] = useState({
    customerId: selected?.customer?.id || "",
    amountPaid: "",
    saleId: "",
  });
  const [searchResults, setSearchResuls] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState(
    selected?.customer?.name || "",
  );
  const [shouldSearch, setShouldSearch] = useState(false);
  const [unpaidSales, setUnpaidSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const isOverpayment =
    Number(payload.amountPaid) > 0 && selected.sale
      ? Number(payload.amountPaid) > selected.sale.remaining
      : Number(payload.amountPaid) > 0 && selected.customer
        ? Number(payload.amountPaid) > (selected.customer?.total_debt ?? 0)
        : false;

  // Fetch unpaid sales when customer is selected
  useEffect(() => {
    const fetchUnpaidSales = async () => {
      if (selected.customer?.id) {
        setLoadingSales(true);
        try {
          const result = await getUnpaidSalesByCustomerId(selected.customer.id);
          setUnpaidSales(result.data || []);
        } catch (error) {
          console.error("Error fetching unpaid sales:", error);
          setUnpaidSales([]);
        } finally {
          setLoadingSales(false);
        }
      } else {
        setUnpaidSales([]);
      }
    };

    fetchUnpaidSales();
  }, [selected.customer?.id]);

  // Debounced search effect
  useEffect(() => {
    // Don't search if customer was selected from dropdown or preloaded
    if (!shouldSearch) {
      return;
    }

    // If search is too short, clear results immediately
    if (customerSearchValue.length < 3) {
      setSearchResuls([]);
      setShowResults(false);
      setSearching(false);
      return;
    }

    // Debounce the search
    setSearching(true);
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const results = (await searchCustomers(
          customerSearchValue,
        )) as Customer[];
        // Ignore stale in-flight results once the query changed or a
        // customer was selected (both retrigger this effect's cleanup).
        if (cancelled) return;
        setSearchResuls(results);
        setShowResults(true);
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300); // 300ms debounce

    // Cleanup function to cancel pending searches
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      setSearching(false);
    };
  }, [customerSearchValue, shouldSearch]);

  // Format date as dd/mm/yy
  const formatShortDate = (timestamp: any) => {
    if (!timestamp) return "No date";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  };

  async function handleSelected(customer: Customer) {
    setSelected((prev) => ({
      ...prev,
      customer: customer,
      sale: undefined,
    }));
    setPayload((prev) => ({
      ...prev,
      customerId: customer?.id,
    }));
  }

  function handleSaleSelected(sale: any) {
    setSelected((prev) => ({
      ...prev,
      sale: sale,
    }));
    setPayload((prev) => ({
      ...prev,
      saleId: sale?.id,
      // amountPaid: String(sale?.amount || ""),
    }));
  }

  function handleSaleCleared() {
    setSelected((prev) => ({
      ...prev,
      sale: undefined,
    }));
    setPayload((prev) => ({
      ...prev,
      saleId: "",
    }));
  }

  const handleClick = (customer: Customer) => {
    console.log("Selected customer:", customer); // Debug: check customer data
    console.log("Customer total_debt:", customer.total_debt); // Debug: check total_debt
    handleSelected(customer);
    setShouldSearch(false); // Prevent search when selecting from dropdown
    setCustomerSearchValue(customer.name);
    setSearchResuls([]);
    setShowResults(false);
  };

  async function handleSubmit(prevState: any, formData: FormData) {
    const values = {
      customerId: payload.customerId,
      amountPaid: formData.get("amount"),
      saleId: payload.saleId,
    };

    setErrors({});

    try {
      await validate.parseAsync(values);

      // If no specific sale is selected, distribute payment across unpaid sales
      if (!payload.saleId || payload.saleId === "") {
        const result = await distributePaymentAcrossSales(
          payload.customerId,
          Number(payload.amountPaid),
          latestProd.open ? latestProd.id : null,
        );

        if (result.status === "SUCCESS") {
          const data = result.data!;
          notify.success(
            messages.payment.distributed(
              data.sales_fully_cleared,
              data.sales_partially_paid,
            ),
          );

          // Reset form after successful submission
          setPayload({
            customerId: "",
            amountPaid: "",
            saleId: "",
          });
          setCustomerSearchValue("");
          setShouldSearch(false);
          setSelected({
            customer: undefined,
            sale: undefined,
          });
          return result;
        } else {
          notify.error(messages.payment.distributeFailed);
          return result;
        }
      } else {
        // Call atomic service function - handles payment creation and sale update in one transaction
        const response = await createPaymentForSale(
          payload.customerId,
          payload.saleId,
          Number(payload.amountPaid),
          latestProd.open ? latestProd.id : null,
        );

        if (response.status !== "SUCCESS") {
          notify.error(messages.payment.createFailed);
          return response;
        }

        notify.success(messages.payment.created);

        // Reset form after successful submission
        setPayload({
          customerId: "",
          amountPaid: "",
          saleId: "",
        });
        setCustomerSearchValue("");
        setShouldSearch(false);
        setSelected({
          customer: undefined,
          sale: undefined,
        });

        return response;
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string>);
        notify.error(messages.generic.validation);
        return { status: "ERROR", error: fieldErrors };
      } else {
        notify.fromError(error, messages.payment.createFailed);
        return { status: "ERROR", error: String(error) };
      }
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, {
    status: "",
    error: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-4 items-center my-5">
      <div className="w-full">
        <div className="w-full transition-all animate-collapsible-down">
          <label htmlFor="amount" className="text-sm">
            Amount
          </label>
          <Input
            type="number"
            placeholder="amount"
            name="amount"
            className={`w-full mt-1 no-spinners ${
              isOverpayment ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onChange={(e) => {
              setPayload((prev) => ({
                ...prev,
                amountPaid: e.target.value,
              }));
            }}
            value={payload.amountPaid}
          />
          {isOverpayment && (
            <p className="text-red-500 text-xs mt-1">
              {selected.sale
                ? `Amount cannot exceed remaining balance: ₦${selected.sale.remaining?.toLocaleString()}`
                : `Amount cannot exceed customer debt: ₦${selected.customer?.total_debt?.toLocaleString()}`}
            </p>
          )}
          {errors.amountPaid && !isOverpayment && (
            <p className="text-red-500 text-xs mt-1">{errors.amountPaid}</p>
          )}
        </div>
      </div>
      <div className="w-full relative">
        <label htmlFor="customer" className="text-sm">
          Customer
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="search customer"
            name="customer"
            className="w-full mt-1 py-6 rounded-lg text-center ring  font-semibold"
            onChange={(e) => {
              setShouldSearch(true); // Enable search when user types
              setCustomerSearchValue(e.target.value);
            }}
            value={customerSearchValue}
          />
          {errors.customerId && (
            <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
          )}

          {searching && (
            <LoaderCircle
              size={18}
              color="#368ffc"
              className="absolute top-1/2 -translate-y-1/2 right-4 animate-spin"
            />
          )}
        </div>
        {showResults && customerSearchValue.length >= 3 && (
          <div className="max-h-32 min-h-20 overflow-y-auto w-max p-3 shadow border rounded-md mt-4 border-primary absolute z-20 bg-background text-foreground justify-self-center flex items-center flex-col justify-center">
            {searchResults.length > 0 ? (
              searchResults?.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleClick(result)}
                  className="px-2 py-1 hover:bg-blue-100 transition-colors duration-200 w-2xs border-b cursor-pointer rounded-md text-center"
                >
                  {result.name}
                </div>
              ))
            ) : (
              <div className="w-2xs rounded-md flex gap-2 justify-center items-center ">
                No customers found <UserRoundX size={18} />
              </div>
            )}
          </div>
        )}
        {errors.customer && (
          <p className="text-red-500 text-xs mt-1">{errors.customer}</p>
        )}
      </div>

      {/* Unpaid Sales Dropdown */}

      <div className="w-full">
        <label className="mb-1 text-sm">Unpaid Sales (Optional)</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-center py-3 px-3 border rounded-md border-primary shadow ring font-semibold cursor-pointer">
              {loadingSales ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading sales...
                </span>
              ) : selected.sale ? (
                <span>
                  {formatShortDate(selected.sale.created_at)} - ₦
                  {selected.sale.remaining}
                </span>
              ) : unpaidSales.length > 0 ? (
                "Select an unpaid sale"
              ) : (
                "No unpaid sales"
              )}
            </div>
          </DropdownMenuTrigger>
          {unpaidSales.length > 0 && (
            <DropdownMenuContent className="max-h-32 overflow-y-auto">
              {selected.sale && (
                <DropdownMenuItem onClick={handleSaleCleared}>
                  <span className="text-sm text-muted-foreground">
                    None (distribute across all)
                  </span>
                </DropdownMenuItem>
              )}
              {unpaidSales.map((sale) => (
                <DropdownMenuItem
                  key={sale.id}
                  onClick={() => handleSaleSelected(sale)}
                >
                  <div className="flex justify-between items-center w-full gap-4">
                    <span className="text-sm">
                      {formatShortDate(sale.created_at)}
                    </span>
                    <span className="font-semibold">₦{sale.remaining}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
        <span className="text-xs text-muted-foreground">
          {unpaidSales.length > 0 && `${unpaidSales.length} unpaid sale(s)`}
        </span>
      </div>

      <Button
        className="bg-primary font-bungee cursor-pointer"
        disabled={isPending || isOverpayment}
        type="submit"
      >
        Create{isPending && <LoaderCircle size={15} className="animate-spin" />}
      </Button>
    </form>
  );
};

export default PaymentCreateForm;
