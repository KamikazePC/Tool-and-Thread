"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { currencySymbols, CurrencyCode } from "@/lib/currency";

// Add types for jsPDF with autoTable extension
interface AutoTableOptions {
  startY?: number;
  head?: Array<Array<string | number>>;
  body?: Array<Array<string | number>>;
  theme?: string;
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontStyle?: string;
    halign?: "left" | "center" | "right";
  };
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    halign?: "left" | "center" | "right";
  };
  columnStyles?: Record<
    string,
    {
      cellWidth?: number | "auto" | "wrap";
      halign?: "left" | "center" | "right";
      fontStyle?: string;
    }
  >;
  margin?: { left?: number; right?: number };
}

// Define extended jsPDF interface
interface ExtendedJsPDF extends jsPDF {
  autoTable?: (options: AutoTableOptions) => void;
  lastAutoTable?: {
    finalY: number;
  };
}

// --- Add Number to Words Helper Function ---
const numToWords = (num: number, currencyCode: CurrencyCode): string => {
  const a = [
    "",
    "one ",
    "two ",
    "three ",
    "four ",
    "five ",
    "six ",
    "seven ",
    "eight ",
    "nine ",
    "ten ",
    "eleven ",
    "twelve ",
    "thirteen ",
    "fourteen ",
    "fifteen ",
    "sixteen ",
    "seventeen ",
    "eighteen ",
    "nineteen ",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const g = [
    "",
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
  ];

  // Define currency units
  const currencyUnits: Record<CurrencyCode, { major: string; minor: string }> =
    {
      NGN: { major: " Naira", minor: "Kobo" },
      USD: { major: " Dollars", minor: "Cents" },
      GBP: { major: " Pounds", minor: "Pence" },
    };

  const { major: majorUnit, minor: minorUnit } =
    currencyUnits[currencyCode] || currencyUnits.NGN; // Default to NGN if unknown

  const makeGroup = (numStr: string): string => {
    const n = Number(numStr);
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    let str = "";
    str += h > 0 ? a[h] + "hundred " : "";
    if (t * 10 + o < 20) {
      str += a[t * 10 + o];
    } else {
      str += b[t] + (o > 0 ? "-" + a[o] : " ");
    }
    return str;
  };

  const numStr = String(num);
  const [integerPart, decimalPart] = numStr.split(".");
  const groups = [];
  for (let i = 0; i < integerPart.length; i += 3) {
    groups.push(
      integerPart.substring(
        Math.max(0, integerPart.length - (i + 3)),
        integerPart.length - i
      )
    );
  }

  let words = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupWords = makeGroup(groups[i]);
    if (groupWords) {
      words += groupWords + (g[i] ? g[i] + " " : "");
    }
  }

  words = words.trim();

  // Handle currency specifics using dynamic units
  const integerWords = words
    ? words.charAt(0).toUpperCase() + words.slice(1) + majorUnit // Use majorUnit
    : `Zero ${majorUnit}`; // Handle zero case

  let decimalWords = "";
  if (decimalPart && Number(decimalPart) > 0) {
    const minorValue = Number(decimalPart.padEnd(2, "0").substring(0, 2)); // Ensure two digits for minor unit
    const minorValueWords = makeGroup(String(minorValue));
    // Use minorUnit, handle "one" case for singular minor unit if needed (e.g., 1 Cent, 1 Pence)
    const minorUnitName =
      minorValue === 1 && minorUnit.endsWith("s")
        ? minorUnit.slice(0, -1)
        : minorUnit;
    decimalWords = minorValueWords
      ? "and " + minorValueWords.trim() + ` ${minorUnitName}`
      : "";
  } else if (integerWords !== `Zero ${majorUnit}`) {
    decimalWords = " only"; // Add "only" if no decimal part and integer part is not zero
  } else {
    // If integer is zero and decimal is zero, explicitly state "Zero ..."
    return `Zero ${majorUnit} only`;
  }

  // Ensure "Zero Dollars and ..." or "Zero Pounds and ..." doesn't happen
  if (integerWords === `Zero ${majorUnit}` && decimalWords.startsWith("and")) {
    return (
      decimalWords.substring(4).trim().charAt(0).toUpperCase() +
      decimalWords.substring(5).trim()
    );
  }

  return (integerWords + decimalWords).replace(/\s+/g, " ").trim(); // Clean up extra spaces
};
// --- End Helper Function ---

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const buyer = searchParams.get("buyer");
  const itemsParam = searchParams.get("items");
  const currency = (searchParams.get("currency") as CurrencyCode) || "NGN";
  const receiptNumber = searchParams.get("receiptNumber");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // --- Parse items data for rendering using useMemo ---
  const parsedItemsForRender = useMemo(() => {
    let items: {
      name: string;
      description?: string | null;
      quantity: number;
      price: number;
      total: number; // Ensure total is always present after this block
    }[] = []; // Initialize as empty array

    const itemsParam = searchParams.get("items");
    console.log("Raw itemsParam from URL:", itemsParam); // Keep log

    if (itemsParam) {
      try {
        const decodedItemsParam = decodeURIComponent(itemsParam);
        console.log("Decoded itemsParam before parse:", decodedItemsParam); // Keep log

        const parsedData = JSON.parse(decodedItemsParam);

        // --- Add Validation ---
        if (Array.isArray(parsedData)) {
          // Ensure total exists, calculate if necessary
          items = parsedData.map((item) => ({
            name: item.name ?? "Unknown Item", // Provide defaults
            description: item.description ?? null,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            total: Number(
              item.total ?? Number(item.price || 0) * Number(item.quantity || 0)
            ),
          }));
        } else {
          console.error("Parsed items data is not an array:", parsedData);
          // Handle non-array case gracefully (e.g., items remains empty)
        }
        // --- End Validation ---
      } catch (error) {
        console.error("Error parsing items data for render:", error);
        console.error(
          "String that caused parsing error:",
          itemsParam ? decodeURIComponent(itemsParam) : itemsParam
        );
        // Items will remain empty, UI should show "No items found"
      }
    } else {
      console.log("itemsParam is null or empty.");
    }

    return items; // Return the processed (or empty) items array
  }, [itemsParam]); // Keep dependency array

  // --- Calculate grand total for rendering ---
  const grandTotalForRender = useMemo(() => {
    return parsedItemsForRender.reduce((sum, item) => sum + item.total, 0);
  }, [parsedItemsForRender]);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      }) as ExtendedJsPDF;

      if (parsedItemsForRender.length === 0) {
        console.error("No items found to generate PDF.");
        alert("No items available to generate the PDF.");
        setIsGeneratingPDF(false);
        return;
      }

      // --- Constants ---
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight(); // Get page height
      const margin = 20;
      const contentW = pageW - margin * 2;
      const primaryColorRGB: [number, number, number] = [79, 138, 208]; // Example: A shade of blue like primary-500
      const textColorRGB: [number, number, number] = [51, 51, 51]; // Dark grey for text
      const lightGrayRGB: [number, number, number] = [245, 245, 245]; // Light gray for striped rows

      // --- Set Document Properties ---
      doc.setProperties({
        title: `Receipt #${receiptNumber || ""}`,
      });
      doc.setTextColor(...textColorRGB);

      // --- Header ---
      let currentY = margin + 10; // Start further down
      doc.setFontSize(22); // Slightly larger
      doc.setFont("helvetica", "bold");
      doc.text("Fashion Equipment and Accessories", pageW / 2, currentY, {
        align: "center",
      });
      currentY += 8; // Space

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal"); // Normal weight for receipt number
      doc.text(`Receipt #${receiptNumber || ""}`, pageW / 2, currentY, {
        align: "center",
      });
      currentY += 15; // More space before details

      // --- Transaction Details (Improved Layout) ---
      doc.setFontSize(11); // Consistent small size for labels/values
      doc.setFont("helvetica", "bold");
      doc.text("Date:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(date), margin + 25, currentY); // Indent value

      doc.setFont("helvetica", "bold");
      doc.text("Time:", pageW / 2, currentY); // Use mid-page for second column
      doc.setFont("helvetica", "normal");
      doc.text(formatTime(date), pageW / 2 + 25, currentY);
      currentY += 7; // Line spacing

      doc.setFont("helvetica", "bold");
      doc.text("Customer:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(buyer || "N/A", margin + 25, currentY);
      currentY += 15; // More space before items

      // --- Items Section Header ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Items Purchased", margin, currentY);
      currentY += 8; // Space before table

      // --- Prepare Items Table Data ---
      const tableHeaders = [
        "S/N",
        "Description",
        "Qty", // Shorter header
        "Unit Cost",
        "Total",
      ];
      const itemsTableData = parsedItemsForRender.map((item, index) => {
        const description = item.description
          ? `${item.name} (${item.description})` // Combine name and desc
          : item.name;
        return [
          index + 1,
          description,
          item.quantity,
          currencySymbols[currency] + " " + item.price.toFixed(2),
          currencySymbols[currency] + " " + item.total.toFixed(2),
        ];
      });
      // --- End Prepare ---

      // --- Items Table ---
      let finalY = currentY; // Use currentY as starting point

      if (typeof autoTable !== "function") {
        // Manual Table Fallback (Styled to mimic striped)
        console.log("AutoTable not available - creating manual table");
        doc.setFontSize(10);

        const colWidths = [30, 85, 15, 30, 30]; // Adjusted widths
        const rowHeight = 8; // Increased row height
        let currentX = margin;

        // Header
        doc.setFillColor(...primaryColorRGB); // Use primary color
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        tableHeaders.forEach((header, i) => {
          doc.rect(currentX, finalY, colWidths[i], rowHeight, "F");
          // Center S/N and Qty headers
          const headerAlign = [0, 2].includes(i) ? "center" : "left";
          const textX =
            headerAlign === "center"
              ? currentX + colWidths[i] / 2
              : currentX + 2;
          doc.text(header, textX, finalY + rowHeight / 2 + 1.5, {
            align: headerAlign,
          }); // Center vertically
          currentX += colWidths[i];
        });
        finalY += rowHeight;

        // Rows
        doc.setTextColor(...textColorRGB);
        doc.setFont("helvetica", "normal");
        itemsTableData.forEach((row, index) => {
          currentX = margin;
          const isEven = index % 2 !== 0; // Stripe odd rows (0-indexed)
          if (isEven) {
            doc.setFillColor(...lightGrayRGB); // Light gray fill
            doc.rect(margin, finalY, contentW, rowHeight, "F");
          }

          row.forEach((cell, i) => {
            doc.setDrawColor(...textColorRGB); // Ensure borders are dark
            // Draw horizontal lines only (mimic striped theme)
            doc.line(
              margin,
              finalY + rowHeight,
              pageW - margin,
              finalY + rowHeight
            );

            // Align numeric columns (Qty, Unit, Total) to the right, S/N center
            const textAlign = [0].includes(i)
              ? "center"
              : [2, 3, 4].includes(i)
              ? "right"
              : "left";
            const textX =
              textAlign === "right"
                ? currentX + colWidths[i] - 2
                : textAlign === "center"
                ? currentX + colWidths[i] / 2
                : currentX + 2;

            // Handle potential text overflow for Description
            if (i === 1) {
              // Description column
              const splitText = doc.splitTextToSize(
                String(cell),
                colWidths[i] - 4
              ); // Max width with padding
              doc.text(splitText, textX, finalY + rowHeight / 2 + 1.5, {
                align: textAlign,
                baseline: "middle",
              });
            } else {
              doc.text(String(cell), textX, finalY + rowHeight / 2 + 1.5, {
                align: textAlign,
                baseline: "middle",
              }); // Center vertically
            }
            currentX += colWidths[i];
          });
          finalY += rowHeight;
        });

        finalY += 5; // Padding after manual table
      } else {
        // Use autoTable
        console.log("Using autoTable function");
        try {
          autoTable(doc, {
            startY: currentY,
            head: [tableHeaders],
            body: itemsTableData,
            theme: "striped", // Use striped theme
            headStyles: {
              fillColor: primaryColorRGB, // Use primary color
              textColor: [255, 255, 255],
              fontStyle: "bold",
              halign: "left", // Default left, override below
              fontSize: 10, // Slightly smaller header font
              cellPadding: 2.5, // More padding
            },
            styles: {
              fontSize: 10,
              cellPadding: 2.5, // More padding
              textColor: textColorRGB,
            },
            columnStyles: {
              0: { cellWidth: 10, halign: "center" }, // S/N
              1: { cellWidth: "auto" }, // Description
              2: { halign: "right", cellWidth: 15 }, // Qty
              3: { halign: "right", cellWidth: 30 }, // Unit Cost
              4: { halign: "right", cellWidth: 30 }, // Total
            },
            alternateRowStyles: {
              fillColor: lightGrayRGB, // Light gray for striping
            },
            margin: { left: margin, right: margin },
            didParseCell: (data) => {
              // Center header text for S/N and Qty
              if (data.section === "head") {
                if (data.column.index === 0 || data.column.index === 2) {
                  data.cell.styles.halign = "center";
                }
              }
            },
          });

          finalY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 10
            : currentY + itemsTableData.length * 8 + 20; // Add more space after table
        } catch (autoTableError) {
          console.error("Error using autoTable:", autoTableError);
          finalY = currentY + itemsTableData.length * 8 + 20; // Fallback estimate
        }
      }

      // --- Grand Total ---
      const grandTotal = grandTotalForRender;
      const totalX = pageW - margin; // Right margin edge

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total:", totalX - 35, finalY, { align: "right" });

      doc.setFontSize(12); // Make total value slightly larger
      doc.setFont("helvetica", "bold");
      doc.text(
        `${currencySymbols[currency]}${grandTotal.toFixed(2)}`,
        totalX,
        finalY,
        { align: "right" }
      );
      finalY += 8; // Space after numerical total

      // --- Grand Total in Words ---
      const totalInWords = numToWords(grandTotal, currency);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const wordsLines = doc.splitTextToSize(
        `Amount in words: ${totalInWords}`,
        contentW // Use content width for wrapping
      );
      doc.text(wordsLines, margin, finalY);
      finalY += wordsLines.length * 4 + 15; // Adjust spacing based on lines

      // --- Footer (Position near bottom) ---
      const footerY = pageH - margin - 20; // Position footer consistently near the bottom
      finalY = Math.max(finalY, footerY); // Ensure footer doesn't overlap content

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Signature:", margin, finalY);
      doc.setLineWidth(0.3);
      doc.line(margin + 25, finalY, margin + 85, finalY); // Longer signature line

      // Center "Thank you" message below signature
      finalY += 10;
      doc.text("Thank you for your business!", pageW / 2, finalY, {
        align: "center",
      });

      // --- PDF Output ---
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        // Mobile: Open in new tab
        const pdfDataUri = doc.output("datauristring");
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(
            `<iframe width='100%' height='100%' src='${pdfDataUri}' title='Receipt Preview'></iframe>`
          );
        } else {
          alert("Please allow popups to view the PDF."); // Inform user if popup blocked
        }
      } else {
        // Desktop: Trigger download
        doc.save(`Receipt_${receiptNumber || "download"}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Controls - Hidden when printing */}
      <div className="print:hidden mb-8 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center">
        <Link href="/admin/transactions">
          <Button
            variant="ghost"
            className="p-0 h-auto text-primary-500 hover:text-primary-600 transition-colors font-medium"
          >
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
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="bg-white p-5 sm:p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-primary-50 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-500 font-serif">
              FE&A
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800 font-serif tracking-tight">
            Fashion Equipment and Accessories
          </h1>
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 font-medium text-sm">
            Receipt #{receiptNumber}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Date
              </h2>
              <p className="text-slate-800 font-medium">{formatDate(date)}</p>
              <p className="text-slate-700">{formatTime(date)}</p>
            </div>
            <div className="sm:text-right">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Customer
              </h2>
              <p className="text-slate-800 font-medium">{buyer}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b border-slate-200 pb-2 font-serif">
            Items
          </h2>
          {/* Render Table if items exist */}
          {parsedItemsForRender.length > 0 ? (
            <div className="overflow-x-auto">
              {" "}
              {/* Add horizontal scroll on small screens if needed */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 uppercase tracking-wider w-12">
                      S/N
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right w-20">
                      Quantity
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right w-28">
                      Unit Cost
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItemsForRender.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="py-3 px-4 text-slate-700 text-center">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {item.description || item.name}{" "}
                        {/* Display description or name */}
                        {item.description &&
                          item.name !== item.description && ( // Show name if different and description exists
                            <span className="block text-xs text-slate-500 italic">
                              ({item.name})
                            </span>
                          )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-right">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-right">
                        {currencySymbols[currency]}
                        {item.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium text-right">
                        {currencySymbols[currency]}
                        {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 italic">
              No items found for this transaction.
            </p>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-slate-200 pt-5 mt-10">
          <div className="flex justify-end items-center">
            {/* Optional: Add Subtotal, Tax etc. here if needed */}
            <div className="w-full max-w-xs">
              {" "}
              {/* Limit width for alignment */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold text-slate-700 font-serif">
                  Grand Total
                </p>
                <p className="text-2xl font-bold text-primary-600">
                  {currencySymbols[currency]}
                  {grandTotalForRender.toFixed(2)}
                </p>
              </div>
              {/* Optionally display total in words here too */}
              <p className="text-sm text-slate-500 italic text-right mt-1">
                {numToWords(grandTotalForRender, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Signature: _________________________</p>{" "}
          {/* Add simple signature line */}
          <p className="font-medium mt-4">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
