import { TableData } from '../domain/TableData';

const money = (n: number) =>
  '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Evita el desfase de zona horaria al parsear 'YYYY-MM-DD'
const fmtDate = (d: string) => {
  const [y, m, day] = (d || '').split('-').map(Number);
  if (!y || !m || !day) return esc(d);
  return new Date(y, m - 1, day).toLocaleDateString('en-US');
};

// Costo de operadores de una orden (salario ya repartido por peso en el dashboard)
export const getOperatorsCost = (item: TableData): number =>
  (item.operators || []).reduce((sum, op) => sum + (Number(op.salary) || 0), 0);

export const generatePrintableHTML = (data: TableData[], filename: string): void => {
  const totalOperatorsCost = data.reduce((sum, i) => sum + getOperatorsCost(i), 0);
  const totalFuelCost = data.reduce((sum, i) => sum + (i.fuelCost || 0), 0);
  const totalExtraCost = data.reduce((sum, i) => sum + (i.extraCost || 0), 0);
  const totalCostAll = data.reduce((sum, i) => sum + (i.totalCost || 0), 0);
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #0B2863 0%, #1e3a8a 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }

        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #F09F52;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .summary-card h3 {
            color: #0B2863;
            font-size: 1.8rem;
            margin-bottom: 5px;
        }

        .summary-card p {
            color: #666;
            font-weight: 500;
        }

        .table-container {
            padding: 30px;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        thead {
            background: #0B2863;
            color: white;
        }

        th, td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        th {
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        tbody tr:hover {
            background: #e3f2fd;
        }

        .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status.finished {
            background: #d4edda;
            color: #155724;
        }

        .status.pending {
            background: #fff3cd;
            color: #856404;
        }

        .status.inactive {
            background: #f8d7da;
            color: #721c24;
        }

        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }

        .currency {
            font-weight: 600;
            color: #22c55e;
        }

        .operators {
            font-size: 0.78rem;
            color: #444;
            min-width: 170px;
        }

        .operators .op {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            white-space: nowrap;
        }

        .operators .op b { font-weight: 600; }

        .cost { font-weight: 600; color: #b45309; }
        .num { text-align: right; white-space: nowrap; }
        .muted { color: #888; }
        td { vertical-align: top; }
        tfoot td {
            font-weight: 700;
            background: #eef2ff;
            border-top: 2px solid #0B2863;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .header {
                background: #0B2863 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .summary {
                background: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            thead {
                background: #0B2863 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            tbody tr:nth-child(even) {
                background: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status.finished {
                background: #d4edda !important;
                color: #155724 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status.pending {
                background: #fff3cd !important;
                color: #856404 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status.inactive {
                background: #f8d7da !important;
                color: #721c24 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            table {
                page-break-inside: auto;
            }
            
            tfoot td {
                background: #eef2ff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            thead {
                display: table-header-group;
            }
        }

        @page {
            margin: 0.5in;
            size: landscape;
        }

        /* ===== Compact layout ===== */
        body { padding: 8px; font-size: 10px; line-height: 1.25; }
        .container { max-width: none; width: 100%; }
        .header { padding: 12px 16px; }
        .header h1 { font-size: 1.3rem; margin-bottom: 2px; }
        .header p { font-size: 0.75rem; }
        .summary { grid-template-columns: repeat(8, 1fr); gap: 6px; padding: 10px 12px; }
        .summary-card { padding: 8px 6px; border-left-width: 3px; }
        .summary-card h3 { font-size: 0.95rem; margin-bottom: 1px; }
        .summary-card p { font-size: 0.65rem; }
        .table-container { padding: 8px 12px; overflow: visible; }
        table { table-layout: fixed; width: 100%; font-size: 0.6rem; border-collapse: separate; border-spacing: 0; }
        th, td { padding: 4px 9px; border-right: 1px solid #eef0f3; word-wrap: break-word; overflow-wrap: anywhere; }
        th { font-size: 0.54rem; letter-spacing: 0.2px; }
        .status { padding: 1px 6px; font-size: 0.54rem; display: inline-block; }
        .operators { min-width: 0; font-size: 0.58rem; }
        .operators .op { white-space: normal; gap: 10px; }
        th:last-child, td:last-child { border-right: none; }
        .sub { display: block; color: #777; font-size: 0.54rem; }
        .footer { padding: 6px; font-size: 0.65rem; }
        @media print {
            body { padding: 0; }
            .summary { padding: 6px 0; }
            .table-container { padding: 4px 0; }
            .header { padding: 8px 12px; }
        }
        @page { margin: 0.3in; size: landscape; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Orders Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>${data.length}</h3>
                <p>Total Orders</p>
            </div>
            <div class="summary-card">
                <h3>${data.filter(item => item.status === 'finished').length}</h3>
                <p>Finished</p>
            </div>
            <div class="summary-card">
                <h3>${data.filter(item => item.status === 'pending').length}</h3>
                <p>Pending</p>
            </div>
            <div class="summary-card">
                <h3>${money(data.reduce((sum, item) => sum + (item.income || 0), 0))}</h3>
                <p>Total Income</p>
            </div>
            <div class="summary-card">
                <h3>${money(data.reduce((sum, item) => sum + (item.expense || 0), 0))}</h3>
                <p>Total Expenses</p>
            </div>
            <div class="summary-card">
                <h3>${money(totalOperatorsCost)}</h3>
                <p>Operators Cost</p>
            </div>
            <div class="summary-card">
                <h3>${money(totalFuelCost)}</h3>
                <p>Fuel Cost</p>
            </div>
            <div class="summary-card">
                <h3>${money(totalExtraCost)}</h3>
                <p>Extra Costs</p>
            </div>
            <div class="summary-card">
                <h3>${money(totalCostAll)}</h3>
                <p>Total Cost</p>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width:10%">Order</th>
                        <th style="width:13%">Customer / Location</th>
                        <th style="width:8%">Job</th>
                        <th class="num" style="width:7%">Weight / Dist.</th>
                        <th class="num" style="width:7%">Income</th>
                        <th class="num" style="width:7%">Expense</th>
                        <th style="width:20%">Operators (pay split by weight)</th>
                        <th class="num" style="width:7%">Operators Cost</th>
                        <th class="num" style="width:7%">Fuel</th>
                        <th class="num" style="width:7%">Extra Costs</th>
                        <th class="num" style="width:7%">Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>
                                <strong>${esc(item.key_ref)}</strong>
                                <span class="sub">${fmtDate(item.dateReference)}</span>
                            </td>
                            <td>
                                ${esc(item.firstName)} ${esc(item.lastName)}
                                <span class="sub">${esc(item.city)}${item.state ? ', ' + esc(item.state) : ''}</span>
                            </td>
                            <td>${esc(item.job)}</td>
                            <td class="num">${esc(item.weight)} lbs<span class="sub">${esc(item.distance)} mi</span></td>
                            <td class="num"><span class="currency">${money(item.income)}</span></td>
                            <td class="num">${money(item.expense)}</td>
                            <td class="operators">
                                ${item.operators && item.operators.length > 0
                                    ? item.operators.map(op => `<div class="op"><span>${esc(op.first_name)} ${esc(op.last_name)}${op.role ? ` <span class="muted">(${esc(op.role)})</span>` : ''}</span><b>${money(Number(op.salary) || 0)}</b></div>`).join('')
                                    : '<span class="muted">No operators assigned</span>'
                                }
                            </td>
                            <td class="num cost">${money(getOperatorsCost(item))}</td>
                            <td class="num">${item.fuelCost ? money(item.fuelCost) : '<span class="muted">-</span>'}</td>
                            <td class="num">${item.extraCost ? money(item.extraCost) : '<span class="muted">-</span>'}</td>
                            <td class="num"><strong>${money(item.totalCost)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">TOTALS (${data.length} orders)</td>
                        <td class="num">${money(data.reduce((sum, i) => sum + (i.income || 0), 0))}</td>
                        <td class="num">${money(data.reduce((sum, i) => sum + (i.expense || 0), 0))}</td>
                        <td></td>
                        <td class="num">${money(totalOperatorsCost)}</td>
                        <td class="num">${money(totalFuelCost)}</td>
                        <td class="num">${money(totalExtraCost)}</td>
                        <td class="num">${money(totalCostAll)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Movewise. All rights reserved.</p>
        </div>
    </div>

    <script>
        // Auto-open print dialog when page loads
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.print();
            }, 500);
        });

        // Close window after printing or canceling
        window.addEventListener('afterprint', function() {
            window.close();
        });
    </script>
</body>
</html>`;

  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback: create a blob and download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};