"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Share2, Printer, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default function ReceiptPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const date = searchParams.get("date")
  const buyer = searchParams.get("buyer")
  const items = searchParams.get("items")?.split(",")
  const total = searchParams.get("total")

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Tool & Thread Receipt",
        text: `Receipt for ${buyer} - ${total}`,
        url: window.location.href,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen">
      {/* Back button - hidden in print */}
      <div className="print:hidden max-w-2xl mx-auto p-8">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Button>
      </div>

      {/* Receipt Content */}
      <div className="max-w-2xl mx-auto p-8 print:p-4 print:mx-0 print:max-w-none bg-white">
        {/* Header */}
        <div className="text-center mb-12 border-b pb-6">
          <h1 className="text-3xl font-serif mb-2">Tool & Thread</h1>
          <div className="text-gray-500 space-y-1">
            <p>Professional Tailoring Services</p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Date Issued</p>
            <p className="font-medium">{formatDate(date)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{buyer}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-500">Description</th>
                <th className="text-right py-3 text-sm font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items?.map((item, index) => {
                const [quantity, name, , price] = item.split(" ")
                return (
                  <tr key={index}>
                    <td className="py-4">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">Quantity: {quantity}</div>
                    </td>
                    <td className="py-4 text-right tabular-nums">{price}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="pt-6 font-medium text-gray-500">Total Amount</td>
                <td className="pt-6 text-right font-bold text-lg tabular-nums">
                  {total?.startsWith("NGN") ? total : total?.replace("$", "USD ")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t pt-8">
          <p className="mb-2">Thank you for your business!</p>
          <p>For any inquiries, please contact us at support@toolandthread.com</p>
        </div>

        {/* Action Buttons - hidden in print */}
        <div className="flex justify-end gap-4 mt-8 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
