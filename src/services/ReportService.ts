import { JsonRpcConnector } from '../rpc/JsonRpcConnector';
import { OdooRpcError } from '../errors/OdooError';

/**
 * Report metadata information
 */
export interface ReportInfo {
  /** Report ID */
  id: number;
  /** Report name */
  name: string;
  /** Report model name */
  model: string;
  /** Report type (e.g., 'qweb-pdf', 'qweb-html') */
  report_type: string;
}

/**
 * Service for Odoo report operations.
 * Provides methods for generating and downloading reports.
 *
 * Note: This is a basic implementation stub. Full report functionality
 * will be implemented in future versions.
 *
 * @example
 * ```typescript
 * const odoo = new OdooClient();
 * await odoo.connect({ host: 'localhost', port: 8069 });
 * await odoo.login('mydb', 'admin', 'password');
 *
 * // Generate a PDF report
 * const pdf = await odoo.report.generate('sale.report_saleorder', [1, 2, 3]);
 * ```
 */
export class ReportService {
  constructor(private _connector: JsonRpcConnector) {}

  /**
   * Generate a report for the given records.
   *
   * @param reportName - Technical name of the report
   * @param recordIds - IDs of records to generate report for
   * @param data - Additional data to pass to the report (optional)
   * @returns Promise resolving to the report content (typically base64 encoded PDF)
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const pdfData = await odoo.report.generate('sale.report_saleorder', [1, 2]);
   * fs.writeFileSync('report.pdf', Buffer.from(pdfData, 'base64'));
   * ```
   */
  async generate(
    reportName: string,
    _recordIds: number[],
    _data?: Record<string, any>
  ): Promise<string> {
    try {
      // This is a placeholder implementation
      // Full implementation would call the report generation endpoint
      throw new OdooRpcError('Report generation not yet implemented');
    } catch (error) {
      throw this.wrapError(
        error,
        `Failed to generate report '${reportName}'`
      );
    }
  }

  /**
   * Get available reports for a model.
   *
   * @param modelName - Name of the model to get reports for
   * @returns Promise resolving to list of available reports
   * @throws {OdooRpcError} If the RPC call fails
   *
   * @example
   * ```typescript
   * const reports = await odoo.report.getAvailable('sale.order');
   * console.log('Available reports:', reports);
   * ```
   */
  async getAvailable(modelName: string): Promise<ReportInfo[]> {
    try {
      // This is a placeholder implementation
      // Full implementation would query ir.actions.report model
      throw new OdooRpcError('Get available reports not yet implemented');
    } catch (error) {
      throw this.wrapError(
        error,
        `Failed to get reports for model '${modelName}'`
      );
    }
  }

  /**
   * Wrap errors with additional context
   */
  private wrapError(error: unknown, context: string): OdooRpcError {
    if (error instanceof OdooRpcError) {
      return new OdooRpcError(
        `${context}: ${error.message}`,
        error.code,
        error.data
      );
    }

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new OdooRpcError(`${context}: ${message}`);
  }
}
