import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBulkOperationDto } from './dto/create-bulk.dto';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BulkService {
  private readonly logger = new Logger(BulkService.name);

  constructor(
    private prisma: PrismaService,
  ) { }

  async startBulkJob(
    file: Express.Multer.File,
    dto: CreateBulkOperationDto,
    tenantId: string,
  ) {
    this.logger.log(`Starting bulk upload for company: ${dto.companyId}`);

    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, tenantId },
    });
    if (!company) {
      throw new Error('Company not found');
    }

    // 1. Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    // 2. Create Record in DB (Status: QUEUED)
    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: 'BULK_UPLOAD',
        companyId: dto.companyId,
        fileName: file.originalname,
        status: 'QUEUED',
        tenantId,
      },
    });

    // 3. Save file to disk with ID as filename for easy retrieval
    const filePath = path.join(uploadDir, operation.id);
    fs.writeFileSync(filePath, file.buffer);

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      return {
        jobId: operation.id,
        status: 'QUEUED',
        totalRows: data.length,
        previewData: data.slice(0, 5),
        headers: Object.keys(data[0] || {}),
      };
    } catch (e) {
      this.logger.error(`Preview failed: ${e.message}`);
      throw e;
    }
  }

  async commitBulkJob(
    id: string,
    mappings: Record<string, string>,
    tenantId: string,
  ) {
    const operation = await this.prisma.bulkOperation.findFirst({
      where: { id, tenantId },
    });
    if (!operation) throw new Error('Job not found');

    const filePath = path.join(process.cwd(), 'uploads', id);

    if (!fs.existsSync(filePath)) throw new Error('File expired or not found');

    // Update status to PROCESSING
    await this.prisma.bulkOperation.updateMany({
      where: { id, tenantId },
      data: { status: 'PROCESSING' },
    });

    // Process synchronously
    this.logger.log(`Processing job ${id} synchronously`);
    // Note: For long-running jobs we may want to offload to a background worker to avoid blocking.
    // For now, we process and return the result for consistent behavior.
    return this.processBulkJobSync(id, mappings, tenantId, operation.companyId, filePath);
  }

  private async processBulkJobSync(
    id: string,
    mappings: Record<string, string>,
    tenantId: string,
    companyId: string,
    filePath: string,
  ) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        for (const [excelHeader, dbField] of Object.entries(mappings)) {
          if (dbField && dbField !== 'ignore') {
            newRow[dbField] = row[excelHeader];
          }
        }
        newRow.companyId = companyId;
        newRow.type = newRow.type || 'TSS';
        newRow.status = 'ACTIVE';
        newRow.tenantId = tenantId;
        return newRow;
      });

      this.logger.log(`Processing ${mappedData.length} rows for job ${id}`);

      let successCount = 0;
      for (const item of mappedData) {
        try {
          const employee = await this.prisma.employee.findFirst({
            where: { companyId: item.companyId, tenantId },
          });

          if (employee) {
            await this.prisma.policy.create({
              data: {
                policyNo: String(
                  item.policyNo ||
                  Math.random().toString(36).substring(7).toUpperCase(),
                ),
                type: item.type,
                startDate: new Date(item.startDate || new Date()),
                endDate: new Date(
                  item.endDate ||
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1),
                  ),
                ),
                premium: Number(item.premium || 0),
                currency: item.currency || 'TRY',
                status: 'ACTIVE',
                tenantId,
                companyId: item.companyId,
                employeeId: employee.id,
              },
            });
            successCount++;
          }
        } catch (e) {
          console.error('Row failed', e.message);
        }
      }

      await this.prisma.bulkOperation.updateMany({
        where: { id, tenantId },
        data: {
          status: 'COMPLETED',
          processedRows: successCount,
          totalRows: mappedData.length,
        },
      });

      // Cleanup file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return { success: true, count: successCount, mode: 'sync' };
    } catch (e) {
      this.logger.error(`Job failed: ${e.message}`);
      await this.prisma.bulkOperation.updateMany({
        where: { id, tenantId },
        data: { status: 'FAILED' },
      });
      // Try cleanup
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { }
      }
      throw e;
    }
  }

  async getJobStatus(id: string, tenantId: string) {
    return this.prisma.bulkOperation.findFirst({
      where: { id, tenantId },
    });
  }
}
