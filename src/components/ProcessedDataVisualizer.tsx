import React, { useState } from "react";
import { 
  BarChart3, 
  Table, 
  LayoutGrid, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Coins,
  TrendingUp,
  Boxes,
  Calendar
} from "lucide-react";

export interface RecordItem {
  id: string;
  date: string;
  product_category: string;
  revenue: number;
  units_sold: number;
  status: "delivered" | "canceled" | "pending" | string;
}

interface Props {
  data: RecordItem[];
}

type FormatOption = "bar_chart" | "data_table" | "cards_view" | "plain_text";

export default function ProcessedDataVisualizer({ data = [] }: Props) {
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full mt-3 p-4 bg-white border border-[#E7E5E4] rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-xs text-[#A8A29E] font-medium font-mono uppercase tracking-wider">No transactional data parsed</span>
      </div>
    );
  }

  // Formatting utility
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Calculations
  const recordCount = data.length;
  const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
  const totalUnits = data.reduce((sum, item) => sum + (Number(item.units_sold) || 0), 0);

  // Group by category for Chart Aggregation
  const categoryAggregate = data.reduce((acc: { [key: string]: { revenue: number, units: number, count: number } }, curr) => {
    const cat = curr.product_category || "Unassigned";
    if (!acc[cat]) {
      acc[cat] = { revenue: 0, units: 0, count: 0 };
    }
    acc[cat].revenue += Number(curr.revenue) || 0;
    acc[cat].units += Number(curr.units_sold) || 0;
    acc[cat].count += 1;
    return acc;
  }, {});

  const chartData = Object.entries(categoryAggregate).map(([name, stats]) => ({
    name,
    ...stats,
    revenueShare: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Status Counts
  const statusSummary = data.reduce((acc: { [key: string]: number }, curr) => {
    const status = (curr.status || "pending").toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Generate plain text report string
  const generatePlainText = () => {
    const header = `${"ID".padEnd(8)}${"DATE".padEnd(12)}${"CATEGORY".padEnd(20)}${"REVENUE".padEnd(12)}${"QTY".padEnd(8)}${"STATUS"}`;
    const divider = "-".repeat(66);
    const rows = data.map(item => {
      const id = item.id || "N/A";
      const date = item.date || "N/A";
      const cat = (item.product_category || "N/A").substring(0, 18);
      const rev = formatCurrency(Number(item.revenue) || 0);
      const qty = String(item.units_sold || 0);
      const status = item.status || "pending";
      
      return `${id.padEnd(8)}${date.padEnd(12)}${cat.padEnd(20)}${rev.padEnd(12)}${qty.padEnd(8)}${status}`;
    });

    const summaryReport = [
      "TRANSACTIONS SUMMARY REPORT",
      "===========================",
      `Total Records: ${recordCount}`,
      `Total Revenue: ${formatCurrency(totalRevenue)}`,
      `Total Units:   ${totalUnits}`,
      "",
      header,
      divider,
      ...rows,
      divider
    ].join("\n");

    return summaryReport;
  };

  return (
    <div className="w-full mt-4 bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden shadow-sm select-none">
      
      {/* Sleek Action Toolbar - Format Selection Buttons */}
      <div className="p-3 bg-[#FCFCFB] border-b border-[#F5F5F4] flex flex-wrap gap-2 items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A8A29E] pl-1">
          Select Presentation Mode:
        </span>
        
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedFormat("bar_chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 cursor-pointer ${
              selectedFormat === "bar_chart"
                ? "bg-[#2D2926] text-white border-[#2D2926]"
                : "bg-white text-[#524F4C] border-[#E7E5E4] hover:bg-[#F5F5F4]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bar Chart
          </button>
          
          <button
            onClick={() => setSelectedFormat("data_table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 cursor-pointer ${
              selectedFormat === "data_table"
                ? "bg-[#2D2926] text-white border-[#2D2926]"
                : "bg-white text-[#524F4C] border-[#E7E5E4] hover:bg-[#F5F5F4]"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Data Table
          </button>
          
          <button
            onClick={() => setSelectedFormat("cards_view")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 cursor-pointer ${
              selectedFormat === "cards_view"
                ? "bg-[#2D2926] text-white border-[#2D2926]"
                : "bg-white text-[#524F4C] border-[#E7E5E4] hover:bg-[#F5F5F4]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards View
          </button>
          
          <button
            onClick={() => setSelectedFormat("plain_text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 cursor-pointer ${
              selectedFormat === "plain_text"
                ? "bg-[#2D2926] text-white border-[#2D2926]"
                : "bg-white text-[#524F4C] border-[#E7E5E4] hover:bg-[#F5F5F4]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Plain Text
          </button>
        </div>
      </div>

      {/* Structured Content Area */}
      <div className="p-4">
        {selectedFormat === null && (
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-5 h-5 text-[#A8A29E] mb-2 animate-pulse" />
            <p className="text-xs text-[#524F4C] font-mono uppercase tracking-wider mb-1">
              Data Request Processed Successfully
            </p>
            <p className="text-[11px] text-[#A8A29E] max-w-sm">
              Click one of the buttons above to visualize the retrieved {recordCount} {recordCount === 1 ? "record" : "records"}.
            </p>
          </div>
        )}

        {/* 1. BAR CHART PRESENTATION */}
        {selectedFormat === "bar_chart" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-[#2D2926] font-semibold border-b border-[#F5F5F4] pb-2">
              <span>Category Revenue Mix</span>
              <span>Share (%)</span>
            </div>
            
            <div className="space-y-3.5">
              {chartData.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2D2926] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2D2926]" />
                      {cat.name}
                    </span>
                    <div className="font-mono text-[11px] text-[#2D2926] font-semibold">
                      {formatCurrency(cat.revenue)} <span className="text-[#A8A29E] font-normal">({cat.revenueShare.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#F5F5F4] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2D2926] rounded-full transition-all duration-700"
                      style={{ width: `${cat.revenueShare}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Aggregation Summary Block */}
            <div className="pt-3 border-t border-[#F5F5F4] grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#A8A29E] block">Combined Revenue</span>
                <span className="text-[14px] font-semibold text-[#2D2926]">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#A8A29E] block">Combined Units</span>
                <span className="text-[14px] font-semibold text-[#2D2926]">{totalUnits} units</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. DATA TABLE PRESENTATION */}
        {selectedFormat === "data_table" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F5F5F4] text-[#A8A29E] font-mono uppercase text-[9px] tracking-wider">
                    <th className="pb-2 font-medium">Tx ID</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                    <th className="pb-2 font-medium text-center">Qty</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF9F8]">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-[#FCFCFB] transition-colors">
                      <td className="py-2 font-mono text-[10px] text-[#A8A29E]">{row.id}</td>
                      <td className="py-2 text-[#524F4C] font-light">{row.date}</td>
                      <td className="py-2 text-[#2D2926] font-medium">{row.product_category}</td>
                      <td className="py-2 text-right font-mono font-medium text-[#2D2926]">
                        {formatCurrency(Number(row.revenue) || 0)}
                      </td>
                      <td className="py-2 text-center font-mono text-[#A8A29E]">{row.units_sold}</td>
                      <td className="py-2 text-right">
                        <span
                          className={`inline-flex items-center text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                            row.status?.toLowerCase() === "delivered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                              : row.status?.toLowerCase() === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-150"
                              : "bg-rose-50 text-rose-700 border border-rose-150"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-2 border-t border-[#F5F5F4] flex items-center justify-between text-[10px] font-mono text-[#A8A29E]">
              <span>Dataset Size: {recordCount} entries</span>
              <div className="flex gap-3">
                <span>Delivered: {statusSummary.delivered || 0}</span>
                <span>Pending: {statusSummary.pending || 0}</span>
                <span>Canceled: {statusSummary.canceled || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. CARDS VIEW PRESENTATION */}
        {selectedFormat === "cards_view" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
            {data.map((row, index) => (
              <div 
                key={index} 
                className="p-3 bg-[#FCFCFB] border border-[#F5F5F4] rounded-xl text-left flex flex-col justify-between hover:border-[#E7E5E4] hover:bg-white transition-all duration-150"
              >
                <div className="pb-2 border-b border-[#FAF9F8] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-[#A8A29E]">
                    Tx {row.id}
                  </span>
                  <span
                    className={`inline-flex items-center text-[8px] font-mono px-1.5 py-0.5 rounded-md ${
                      row.status?.toLowerCase() === "delivered"
                        ? "bg-emerald-50 text-emerald-600"
                        : row.status?.toLowerCase() === "pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                
                <div className="my-2.5 space-y-0.5">
                  <p className="text-[10px] font-mono tracking-wider uppercase text-[#A8A29E]">Category</p>
                  <p className="text-xs font-semibold text-[#2D2926]">{row.product_category}</p>
                </div>

                <div className="mt-1 flex items-center justify-between pt-1.5 border-t border-[#FAF9F8]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A8A29E]" />
                    <span className="text-[10px] text-[#A8A29E]">{row.date}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#2D2926] block">
                      {formatCurrency(Number(row.revenue) || 0)}
                    </span>
                    <span className="text-[9px] text-[#A8A29E] tracking-wider leading-none font-mono">
                      {row.units_sold} {row.units_sold === 1 ? "unit" : "units"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. PLAIN TEXT PRESENTATION */}
        {selectedFormat === "plain_text" && (
          <div className="animate-fadeIn">
            <pre className="w-full p-3 bg-[#FCFCFB] border border-[#F5F5F4] rounded-xl text-[11px] font-mono text-[#2D2926] leading-relaxed overflow-x-auto max-h-72 whitespace-pre no-scrollbar select-text text-left">
              {generatePlainText()}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
