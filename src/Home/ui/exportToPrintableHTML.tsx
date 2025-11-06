import { TableData } from '../domain/TableData';

export const generatePrintableHTML = (data: TableData[], filename: string): void => {
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
            max-width: 1200px;
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
            padding: 12px 8px;
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
            font-size: 0.8rem;
            color: #666;
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
                <h3>$${data.reduce((sum, item) => sum + (item.income || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p>Total Income</p>
            </div>
            <div class="summary-card">
                <h3>$${data.reduce((sum, item) => sum + (item.expense || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p>Total Expenses</p>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Order Ref</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Location</th>
                        <th>Job</th>
                        <th>Weight</th>
                        <th>Distance</th>
                        <th>Income</th>
                        <th>Expense</th>
                        <th>Operators</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td><span class="status ${item.status}">${item.status}</span></td>
                            <td><strong>${item.key_ref}</strong></td>
                            <td>${new Date(item.dateReference).toLocaleDateString('en-US')}</td>
                            <td>${item.firstName} ${item.lastName}</td>
                            <td>${item.city}, ${item.state}</td>
                            <td>${item.job}</td>
                            <td>${item.weight} lbs</td>
                            <td>${item.distance} miles</td>
                            <td><span class="currency">$${(item.income || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                            <td><span class="currency">$${(item.expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                            <td class="operators">
                                ${item.operators && item.operators.length > 0 
                                    ? item.operators.map(op => `${op.first_name} ${op.last_name}`).join(', ')
                                    : 'No operators assigned'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
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