"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Share2, Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useState } from "react"

export default function ReceiptPage() {
  const searchParams = useSearchParams()
  const date = searchParams.get("date")
  const buyer = searchParams.get("buyer")
  const items = searchParams.get("items")?.split(",")
  const total = searchParams.get("total")
  const receiptNumber = searchParams.get("receiptNumber")
  const id = window.location.pathname.split('/').pop() // Get the transaction ID from the URL
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "h:mm a")
    } catch (error) {
      console.error("Error formatting time:", error)
      return ""
    }
  }

  const handleDownloadPDF = async () => {
    if (!id) {
      alert("Transaction ID not found. Cannot generate PDF.");
      return;
    }
    
    setIsGeneratingPDF(true);
    
    try {
      // Use the server API to generate the PDF
      const response = await fetch(`/api/receipts/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      
      // Get the PDF as a blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Use receiptNumber in the filename instead of transaction ID
      a.download = `Receipt_${receiptNumber || id}.pdf`;
      
      // Append to the body and trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    try {
      // Check if the Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: "Tool & Thread Receipt",
          text: `Receipt #${receiptNumber} for ${buyer} - ${total}`,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        // Copy the URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Receipt link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Additional fallback if clipboard API fails
      prompt("Copy this link to share your receipt:", window.location.href);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Controls - Hidden when printing */}
      <div className="print:hidden mb-8 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center">
        <Link href="/admin/transactions">
          <Button variant="ghost" className="p-0 h-auto text-primary-500 hover:text-primary-600 transition-colors font-medium">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Transactions
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium flex-1 sm:flex-initial h-12 px-5"
          >
            <Download className="h-5 w-5 mr-2" />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            onClick={handleShare} 
            className="bg-accent-500 hover:bg-accent-600 text-slate-800 transition-colors font-medium flex-1 sm:flex-initial h-12 px-5"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white p-5 sm:p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-500 font-serif">T&T</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800 font-serif tracking-tight">Tool & Thread</h1>
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 font-medium text-sm">
            Receipt #{receiptNumber}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Date</h2>
              <p className="text-slate-800 font-medium">{formatDate(date)}</p>
              <p className="text-slate-700">{formatTime(date)}</p>
            </div>
            <div className="sm:text-right">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer</h2>
              <p className="text-slate-800 font-medium">{buyer}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b border-slate-200 pb-2 font-serif">Items</h2>
          <div className="space-y-5">
            {items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium text-slate-800">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-slate-700 font-serif">Total</p>
            <p className="text-2xl font-bold text-primary-600">{total}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p className="font-medium">Thank you for your business!</p>
          <p className="mt-1">For questions or concerns, please contact us.</p>
        </div>
      </div>
    </div>
  )
}
