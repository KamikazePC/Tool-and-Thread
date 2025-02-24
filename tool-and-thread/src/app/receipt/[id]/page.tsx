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
  const receiptNumber = searchParams.get("receiptNumber")

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
        text: `Receipt #${receiptNumber} for ${buyer} - ${total}`,
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
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Button>
      </div>

      {/* Receipt content */}
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg print:shadow-none">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Tool & Thread</h1>
          <p className="text-gray-600">Receipt #{receiptNumber}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Date:</span>
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span>{buyer}</span>
          </div>
        </div>

        <div className="border-t border-b py-4 mb-8">
          <div className="font-medium mb-4">Items:</div>
          <div className="space-y-2">
            {items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between font-bold text-lg mb-8">
          <span>Total:</span>
          <span>{total}</span>
        </div>

        {/* Action buttons - hidden in print */}
        <div className="print:hidden flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}
