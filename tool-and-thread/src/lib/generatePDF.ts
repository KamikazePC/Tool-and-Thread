import { jsPDF } from "jspdf";
import { formatCurrency } from "./currency";
import { Transaction } from "@/types";
import { format } from "date-fns";

// Add standard font
import "jspdf-autotable";

// Define Tailwind colors for consistent styling
const colors = {
  primary: {
    50: "#E6F2F2",
    100: "#CCE5E5",
    200: "#99CBCB",
    300: "#66B2B2",
    400: "#339898",
    500: "#0D6E6E", // Main primary color
    600: "#0B5858",
    700: "#084242",
    800: "#052C2C",
    900: "#031616",
  },
  accent: {
    500: "#F9C846", // Main accent color
  },
  slate: {
    300: "#CBD5E0", // Adding the missing slate-300 color
    500: "#64748B",
    600: "#475569",
    700: "#3E4C59", // Main text color
    800: "#27272A",
  },
};

// Fonts and typography constants to match globals.css
const typography = {
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
};

export async function generateReceipt(
  transaction: Transaction
): Promise<Buffer> {
  // Create PDF document with slightly larger default size for better readability
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Helper function to add text with advanced styling
  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      align?: "left" | "center" | "right" | "justify";
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      textColor?: string;
      font?: "serif" | "sans"; // To match Inter (sans) and Playfair Display (serif)
      lineHeight?: number;
    } = {}
  ) => {
    const defaults = {
      align: "left" as const,
      fontSize: 12,
      fontStyle: "normal" as const,
      textColor: colors.slate[700],
      font: "sans" as const,
      lineHeight: typography.lineHeight.normal,
    };
    const settings = { ...defaults, ...options };

    // Map our custom fonts to PDF standard fonts (closest approximations)
    // In a production app, you could add custom font files
    const fontMap = {
      serif: {
        normal: "times",
        bold: "times",
        italic: "times",
      },
      sans: {
        normal: "helvetica",
        bold: "helvetica",
        italic: "helvetica",
      },
    };

    // Set font style
    doc.setFont(fontMap[settings.font][settings.fontStyle], settings.fontStyle);
    doc.setFontSize(settings.fontSize);
    doc.setTextColor(settings.textColor);

    // Adjust line height proportionally based on font size
    const scaledLineHeight = settings.fontSize * (settings.lineHeight / 1.2);

    // Split text for multi-line handling with proper line height
    const textLines = doc.splitTextToSize(
      text,
      doc.internal.pageSize.width - 40
    );

    for (let i = 0; i < textLines.length; i++) {
      doc.text(textLines[i], x, y + i * scaledLineHeight, {
        align: settings.align,
      });
    }
  };

  // Helper function to draw a circle with text inside (for the logo)
  const drawCircleLogo = () => {
    const centerX = doc.internal.pageSize.width / 2;
    const centerY = 35;
    const radius = 12;

    // Draw circle
    // Convert hex to RGB for jsPDF
    const primaryColor50 = hexToRgb(colors.primary[50]);
    doc.setFillColor(primaryColor50.r, primaryColor50.g, primaryColor50.b); // Light primary color bg-primary-50
    doc.circle(centerX, centerY, radius, "F");

    // Add text
    doc.setFont("times", "bold"); // Using Times as closest to Playfair Display
    doc.setFontSize(14);
    doc.setTextColor(colors.primary[500]); // text-primary-500
    doc.text("FE&A", centerX, centerY + 1, { align: "center" });
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Format date like the web interface
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return new Date(dateString).toLocaleDateString();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Start adding content
  // Draw logo
  drawCircleLogo();

  // Company Header
  const centerX = doc.internal.pageSize.width / 2;
  addText("Fashion Equipment and Accessories", centerX, 60, {
    fontSize: 24,
    align: "center",
    fontStyle: "bold",
    textColor: colors.slate[800], // text-slate-800
    font: "serif", // Use serif font (Playfair Display in web)
    lineHeight: typography.lineHeight.tight,
  });

  // Receipt Number badge
  const receiptNumberText = `Receipt #${transaction.receiptNumber}`;
  const receiptTextWidth = doc.getTextWidth(receiptNumberText);
  const badgeX = (doc.internal.pageSize.width - receiptTextWidth) / 2 - 5;
  const badgeY = 65;
  const badgeWidth = receiptTextWidth + 10;
  const badgeHeight = 8;

  // Draw badge background
  const primaryColor50 = hexToRgb(colors.primary[50]);
  doc.setFillColor(primaryColor50.r, primaryColor50.g, primaryColor50.b); // bg-primary-50
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4, 4, "F");

  // Add receipt number text
  addText(receiptNumberText, centerX, badgeY + 5.5, {
    fontSize: 10,
    align: "center",
    fontStyle: "bold",
    textColor: colors.primary[700], // text-primary-700
    font: "sans", // Use sans font (Inter in web)
  });

  // Transaction Details
  const startY = 85;
  const leftMargin = 20;
  const rightMargin = doc.internal.pageSize.width - 20;

  // Draw grid for details (date and customer)
  // Left column header - Date
  addText("DATE", leftMargin, startY, {
    fontSize: 9,
    fontStyle: "bold",
    textColor: colors.slate[500], // text-slate-500
    font: "sans",
  });

  // Date value
  addText(formatDate(transaction.date), leftMargin, startY + 8, {
    fontSize: 11,
    fontStyle: "bold",
    textColor: colors.slate[800], // text-slate-800
    font: "sans",
  });

  // Time value
  addText(formatTime(transaction.date), leftMargin, startY + 15, {
    fontSize: 11,
    textColor: colors.slate[700], // text-slate-700
    font: "sans",
  });

  // Right column header - Customer
  addText("CUSTOMER", rightMargin, startY, {
    fontSize: 9,
    fontStyle: "bold",
    textColor: colors.slate[500], // text-slate-500
    align: "right",
    font: "sans",
  });

  // Customer value
  addText(transaction.buyerName, rightMargin, startY + 8, {
    fontSize: 11,
    fontStyle: "bold",
    textColor: colors.slate[800], // text-slate-800
    align: "right",
    font: "sans",
  });

  // Items section
  const itemsY = startY + 30;

  // Draw section header
  addText("Items", leftMargin, itemsY, {
    fontSize: 14,
    fontStyle: "bold",
    textColor: colors.slate[800], // text-slate-800
    font: "serif", // Use serif font for section headers
    lineHeight: typography.lineHeight.tight,
  });

  // Draw line under section header
  const slateColor200 = hexToRgb(colors.slate[300]);
  doc.setDrawColor(slateColor200.r, slateColor200.g, slateColor200.b); // border-slate-200
  doc.line(leftMargin, itemsY + 4, rightMargin, itemsY + 4);

  // Add items
  let currentY = itemsY + 15;

  // Draw items
  transaction.items.forEach((item) => {
    addText(item.name, leftMargin, currentY, {
      fontSize: 11,
      fontStyle: "bold",
      textColor: colors.slate[800], // text-slate-800
      font: "sans",
    });

    // Only add price if we have quantity > 1
    if (item.quantity > 1) {
      const itemTotalText = `${item.quantity} × ${formatCurrency(
        parseFloat(item.price),
        transaction.currency
      )}`;
      addText(itemTotalText, rightMargin, currentY, {
        fontSize: 11,
        align: "right",
        textColor: colors.slate[800], // text-slate-800
        font: "sans",
      });
    } else {
      // Just show the price for single items
      addText(
        formatCurrency(parseFloat(item.price), transaction.currency),
        rightMargin,
        currentY,
        {
          fontSize: 11,
          align: "right",
          textColor: colors.slate[800], // text-slate-800
          font: "sans",
        }
      );
    }

    currentY += 10;
  });

  // Total section
  currentY += 5;

  // Draw line above total
  doc.setDrawColor(slateColor200.r, slateColor200.g, slateColor200.b); // border-slate-200
  doc.line(leftMargin, currentY, rightMargin, currentY);

  currentY += 10;

  // Add total label and amount
  addText("Total", leftMargin, currentY, {
    fontSize: 14,
    fontStyle: "bold",
    textColor: colors.slate[700], // text-slate-700
    font: "serif", // Use serif font for Total label
    lineHeight: typography.lineHeight.tight,
  });

  addText(
    formatCurrency(parseFloat(transaction.total), transaction.currency),
    rightMargin,
    currentY,
    {
      fontSize: 16,
      fontStyle: "bold",
      textColor: colors.primary[600], // text-primary-600
      align: "right",
      font: "sans",
    }
  );

  // Footer
  const footerY = 250;

  addText("Thank you for your business!", centerX, footerY, {
    fontSize: 10,
    fontStyle: "bold",
    textColor: colors.slate[500], // text-slate-500
    align: "center",
    font: "sans",
  });

  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
