"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Share2, Printer, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default function ReceiptPage() {
  const searchParams = useSearchParams()
  const date = searchParams.get("date")
  const buyer = searchParams.get("buyer")
  const items = searchParams.get("items")?.split(",")
  const total = searchParams.get("total")
  const receiptNumber = searchParams.get("receiptNumber")

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
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
        text: `Receipt #${receiptNumber} for ${buyer} - ${total}`,
        url: window.location.href,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Print/Share Controls - Hidden when printing */}
      <div className="print:hidden mb-6 flex justify-between items-center">
        <Link href="/admin/transactions">
          <Button variant="ghost" className="p-0 h-auto text-primary-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-primary-500 hover:bg-primary-600 text-white transition-colors">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={handleShare} className="bg-accent-500 hover:bg-accent-600 text-slate-800 transition-colors">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-500">T&T</span>
          </div>
          <h1 className="text-3xl font-bold mb-1 text-slate-800">Tool & Thread</h1>
          <div className="inline-block px-4 py-1 rounded-full bg-primary-50 text-primary-700 font-medium">
            Receipt #{receiptNumber}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-slate-500 mb-1">Date</h2>
              <p className="text-slate-700">{formatDate(date)}</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-medium text-slate-500 mb-1">Customer</h2>
              <p className="text-slate-700">{buyer}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 border-b border-slate-200 pb-2">Items</h2>
          <div className="space-y-4">
            {items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-slate-700">Total</p>
            <p className="text-xl font-bold text-primary-600">{total}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Thank you for your business!</p>
          <p className="mt-1">For questions or concerns, please contact us.</p>
        </div>
      </div>
    </div>
  )
}
